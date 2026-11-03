import zlib
import struct
import math
import os

def create_png(width, height, get_pixel_func):
    """Generates an RGBA PNG using only standard python library (zlib, struct)."""
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0: None
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])
    
    def make_chunk(chunk_type, data):
        length = struct.pack(">I", len(data))
        crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc

    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr_chunk = make_chunk(b"IHDR", ihdr_data)
    idat_chunk = make_chunk(b"IDAT", zlib.compress(bytes(raw_data), 9))
    iend_chunk = make_chunk(b"IEND", b"")
    return png_header + ihdr_chunk + idat_chunk + iend_chunk

def draw_congobiz_icon(x, y, w, h, is_maskable=False):
    # Normalized coords from 0 to 1
    nx = x / float(w)
    ny = y / float(h)
    
    # Background gradient: from #059669 (top left) to #047857 (bottom right)
    bg_r = int(5 + (4 - 5) * ny)
    bg_g = int(150 + (120 - 150) * ny)
    bg_b = int(105 + (87 - 105) * ny)
    
    if not is_maskable:
        # Rounded corners for standalone / apple icon (corner radius ~ 20% of width)
        cr = 0.22
        in_corner_x = min(nx, 1.0 - nx)
        in_corner_y = min(ny, 1.0 - ny)
        if in_corner_x < cr and in_corner_y < cr:
            dx = cr - in_corner_x
            dy = cr - in_corner_y
            dist = math.sqrt(dx*dx + dy*dy)
            if dist > cr:
                return (0, 0, 0, 0) # Transparent outside squircle
    
    # Scale content within safe zone
    scale = 0.72 if is_maskable else 0.84
    cx, cy = 0.5, 0.5
    sx = (nx - cx) / scale + 0.5
    sy = (ny - cy) / scale + 0.5
    
    # Decorative subtle circular highlight in center
    dist_c = math.sqrt((sx - 0.5)**2 + (sy - 0.5)**2)
    if dist_c < 0.42:
        factor = (0.42 - dist_c) / 0.42 * 0.15
        bg_r = int(min(255, bg_r * (1 + factor) + 15 * factor))
        bg_g = int(min(255, bg_g * (1 + factor) + 30 * factor))
        bg_b = int(min(255, bg_b * (1 + factor) + 20 * factor))

    # Awning / Shop roof (Amber-gold: #F59E0B / #FBBF24)
    # y between 0.26 and 0.38, x between 0.22 and 0.78
    if 0.25 <= sy <= 0.36 and 0.20 <= sx <= 0.80:
        # Awning trapezoid
        t = (sy - 0.25) / 0.11
        x_min = 0.22 - t * 0.03
        x_max = 0.78 + t * 0.03
        if x_min <= sx <= x_max:
            # Striped awning pattern (Amber and White stripes)
            stripe_phase = int((sx - x_min) / ((x_max - x_min) / 7.0))
            if stripe_phase % 2 == 0:
                return (245, 158, 11, 255) # Deep amber
            else:
                return (254, 240, 138, 255) # Light warm cream

    # POS / Store Body (White rounded box)
    # y between 0.36 and 0.76, x between 0.24 and 0.76
    if 0.36 <= sy <= 0.76 and 0.25 <= sx <= 0.75:
        # Check rounded bottom corners
        b_cr = 0.06
        b_inx = min(sx - 0.25, 0.75 - sx)
        b_iny = 0.76 - sy
        if b_inx < b_cr and b_iny < b_cr:
            if math.sqrt((b_cr - b_inx)**2 + (b_cr - b_iny)**2) > b_cr:
                return (bg_r, bg_g, bg_b, 255)
        
        # Inside POS body:
        # Screen / display area (Emerald-dark tablet screen: y from 0.40 to 0.60, x from 0.31 to 0.69)
        if 0.41 <= sy <= 0.60 and 0.32 <= sx <= 0.68:
            # Screen bezel / screen background
            scr_r, scr_g, scr_b = 6, 78, 59
            
            # Currency symbol '$' in center (simple crisp rendering)
            # x around 0.50, y around 0.505
            dx_s = abs(sx - 0.50)
            dy_s = abs(sy - 0.505)
            # S shape / Dollar bar
            is_vertical_bar = (dx_s < 0.012 and dy_s < 0.065)
            is_s_top = (0.03 < sy - 0.505 < 0.05 and dx_s < 0.035)
            is_s_mid = (abs(sy - 0.505) < 0.012 and dx_s < 0.035)
            is_s_bot = (-0.05 < sy - 0.505 < -0.03 and dx_s < 0.035)
            is_s_left = (-0.03 <= sy - 0.505 <= 0.012 and abs(sx - 0.465) < 0.012)
            is_s_right = (0.012 <= sy - 0.505 <= 0.05 and abs(sx - 0.535) < 0.012)
            
            if is_vertical_bar or is_s_top or is_s_mid or is_s_bot or is_s_left or is_s_right:
                return (52, 211, 153, 255) # Bright mint green
            return (scr_r, scr_g, scr_b, 255)
        
        # Keypad / Receipt slot area (y from 0.63 to 0.71)
        if 0.64 <= sy <= 0.70 and 0.33 <= sx <= 0.67:
            # 3 buttons/dots
            btn1 = math.sqrt((sx - 0.38)**2 + (sy - 0.67)**2) < 0.02
            btn2 = math.sqrt((sx - 0.50)**2 + (sy - 0.67)**2) < 0.02
            btn3 = math.sqrt((sx - 0.62)**2 + (sy - 0.67)**2) < 0.02
            if btn1 or btn2 or btn3:
                return (209, 213, 219, 255) # light gray dot
            return (243, 244, 246, 255) # light surface
        
        return (255, 255, 255, 255) # White body

    return (bg_r, bg_g, bg_b, 255)

def main():
    os.makedirs('public', exist_ok=True)
    
    # 1. 192x192 icon
    print("Generating public/pwa-192x192.png...")
    png_192 = create_png(192, 192, lambda x, y, w, h: draw_congobiz_icon(x, y, w, h, False))
    with open('public/pwa-192x192.png', 'wb') as f:
        f.write(png_192)

    # 2. 512x512 icon
    print("Generating public/pwa-512x512.png...")
    png_512 = create_png(512, 512, lambda x, y, w, h: draw_congobiz_icon(x, y, w, h, False))
    with open('public/pwa-512x512.png', 'wb') as f:
        f.write(png_512)

    # 3. 512x512 maskable icon (full bleed background, padded content)
    print("Generating public/pwa-maskable-512x512.png...")
    png_maskable = create_png(512, 512, lambda x, y, w, h: draw_congobiz_icon(x, y, w, h, True))
    with open('public/pwa-maskable-512x512.png', 'wb') as f:
        f.write(png_maskable)

    # 4. 180x180 apple touch icon
    print("Generating public/apple-touch-icon.png...")
    png_apple = create_png(180, 180, lambda x, y, w, h: draw_congobiz_icon(x, y, w, h, False))
    with open('public/apple-touch-icon.png', 'wb') as f:
        f.write(png_apple)

    # 5. 64x64 favicon
    print("Generating public/favicon-64.png...")
    png_fav = create_png(64, 64, lambda x, y, w, h: draw_congobiz_icon(x, y, w, h, False))
    with open('public/favicon.png', 'wb') as f:
        f.write(png_fav)

    print("All PWA icons generated successfully!")

if __name__ == '__main__':
    main()
