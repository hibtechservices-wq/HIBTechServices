/**
 * Helper to generate official corporate seal (cachet/tampon) and signature SVGs for documents.
 */

export function generateDefaultStampSvg(companyName: string = 'CONGO TECH SARL', city: string = 'RÉP. DÉM. DU CONGO', nif: string = 'A2109845B'): string {
  const safeName = (companyName || 'CONGO TECH SARL').toUpperCase().slice(0, 32);
  const safeCity = (city || 'RÉP. DÉM. DU CONGO').toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <defs>
    <path id="circlePathTop" d="M 30,100 A 70,70 0 1,1 170,100" fill="none" />
    <path id="circlePathBottom" d="M 170,100 A 70,70 0 1,1 30,100" fill="none" />
  </defs>
  <!-- Outer double rings with subtle stamped ink feel -->
  <circle cx="100" cy="100" r="94" fill="none" stroke="#2563eb" stroke-width="3.5" stroke-dasharray="800" opacity="0.9" />
  <circle cx="100" cy="100" r="88" fill="none" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.85" />
  <circle cx="100" cy="100" r="58" fill="none" stroke="#2563eb" stroke-width="2" opacity="0.9" />

  <!-- Circular text around the seal -->
  <text fill="#2563eb" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10.5" font-weight="800" letter-spacing="1.5">
    <textPath href="#circlePathTop" startOffset="50%" text-anchor="middle">
      ★ ${safeName} ★
    </textPath>
  </text>

  <text fill="#2563eb" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="9" font-weight="700" letter-spacing="1.2">
    <textPath href="#circlePathBottom" startOffset="50%" text-anchor="middle">
      ● ${safeCity} ●
    </textPath>
  </text>

  <!-- Inner Center Content -->
  <g fill="#2563eb" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif">
    <text x="100" y="82" font-size="8" font-weight="800" letter-spacing="1">DIRECTION</text>
    <text x="100" y="96" font-size="11" font-weight="900" letter-spacing="1.5">GÉNÉRALE</text>
    <line x1="68" y1="103" x2="132" y2="103" stroke="#2563eb" stroke-width="1.5" />
    <text x="100" y="116" font-size="7.5" font-family="'JetBrains Mono', monospace" font-weight="700">NIF: ${nif}</text>
    <text x="100" y="128" font-size="7" font-weight="700" letter-spacing="0.5">SCEAU OFFICIEL</text>
  </g>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateDefaultSignatureSvg(signatoryName: string = 'La Direction'): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 90" width="240" height="90">
  <path d="M 20 65 Q 45 20, 75 35 T 120 40 Q 145 10, 160 55 T 195 45 Q 210 35, 225 50" fill="none" stroke="#1e3a8a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M 35 45 Q 60 75, 110 50 Q 140 30, 185 60 Q 205 70, 230 40" fill="none" stroke="#1e3a8a" stroke-width="2" stroke-linecap="round" opacity="0.85" />
  <path d="M 50 72 L 210 68" fill="none" stroke="#1e3a8a" stroke-width="1.5" stroke-linecap="round" opacity="0.7" />
  <text x="120" y="84" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="8.5" font-weight="600" fill="#1e3a8a" text-anchor="middle" font-style="italic">
    ${signatoryName}
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function generateCashPaidStampSvg(companyName: string = 'CONGO TECH SARL', cashierName?: string): string {
  const safeName = (companyName || 'CONGO TECH SARL').toUpperCase().slice(0, 32);
  const safeCashier = cashierName ? cashierName.toUpperCase() : 'CAISSE CENTRALE';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150" width="320" height="150">
  <!-- Outer double border with distressed red stamp ink appearance -->
  <rect x="6" y="6" width="308" height="138" rx="10" fill="none" stroke="#dc2626" stroke-width="4.5" opacity="0.95" />
  <rect x="15" y="15" width="290" height="120" rx="6" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="6 3" opacity="0.88" />
  
  <!-- Top company tag -->
  <text x="160" y="36" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="10.5" font-weight="900" fill="#dc2626" text-anchor="middle" letter-spacing="2">
    ★ ${safeName} ★
  </text>
  
  <line x1="28" y1="43" x2="292" y2="43" stroke="#dc2626" stroke-width="1.8" opacity="0.85" />
  
  <!-- Central Big PAYÉ CASH Headline -->
  <g fill="#dc2626" text-anchor="middle" font-family="'Plus Jakarta Sans', Arial, sans-serif">
    <text x="160" y="85" font-size="36" font-weight="900" letter-spacing="4" font-style="normal">
      PAYÉ CASH
    </text>
    <text x="160" y="104" font-size="10.5" font-weight="800" letter-spacing="2">
      BON POUR ACQUIT · EN ESPÈCES
    </text>
  </g>
  
  <line x1="28" y1="113" x2="292" y2="113" stroke="#dc2626" stroke-width="1.8" opacity="0.85" />
  
  <!-- Bottom footer -->
  <text x="160" y="128" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="9.5" font-weight="800" fill="#dc2626" text-anchor="middle" letter-spacing="1.5">
    ${safeCashier} · RÈGLEMENT COMPTANT
  </text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

