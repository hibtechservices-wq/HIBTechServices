import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  NetworkEquipment,
  EquipmentType,
  EquipmentStatus,
  StarlinkSpecifics,
  CctvCameraSpecifics,
  NvrDvrSpecifics,
  RouterSpecifics,
  AccessPointSpecifics,
} from '../../types';
import {
  X,
  Check,
  Radio,
  Video,
  HardDrive,
  Router as RouterIcon,
  Wifi,
  Server,
  Key,
  Shield,
  MapPin,
  Calendar,
  User,
  Info,
} from 'lucide-react';

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipmentToEdit: NetworkEquipment | null;
  defaultType?: EquipmentType;
}

export const EquipmentModal: React.FC<EquipmentModalProps> = ({
  isOpen,
  onClose,
  equipmentToEdit,
  defaultType = 'STARLINK',
}) => {
  const { clients, addEquipment, updateEquipment } = useApp();

  // General fields
  const [name, setName] = useState('');
  const [type, setType] = useState<EquipmentType>(defaultType);
  const [clientId, setClientId] = useState('');
  const [siteName, setSiteName] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [status, setStatus] = useState<EquipmentStatus>('ACTIVE');
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().slice(0, 10));
  const [lastMaintenanceDate, setLastMaintenanceDate] = useState('');
  const [nextMaintenanceDate, setNextMaintenanceDate] = useState('');
  const [assignedTechnician, setAssignedTechnician] = useState('');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // Starlink fields
  const [slKitNumber, setSlKitNumber] = useState('');
  const [slDishSerial, setSlDishSerial] = useState('');
  const [slTerminalId, setSlTerminalId] = useState('');
  const [slAccountEmail, setSlAccountEmail] = useState('');
  const [slPlan, setSlPlan] = useState('Standard Résidentiel RDC');
  const [slPublicIp, setSlPublicIp] = useState('');
  const [slBypass, setSlBypass] = useState(false);
  const [slRouterModel, setSlRouterModel] = useState('Starlink Gen 3 WiFi 6');
  const [slSsid, setSlSsid] = useState('');
  const [slPassword, setSlPassword] = useState('');
  const [slGps, setSlGps] = useState('');
  const [slLatency, setSlLatency] = useState<number>(45);

  // CCTV Camera fields
  const [camBrand, setCamBrand] = useState('Hikvision');
  const [camModel, setCamModel] = useState('');
  const [camType, setCamType] = useState<'DOME' | 'BULLET' | 'PTZ' | 'EYEBALL' | 'PANORAMIC'>('DOME');
  const [camIp, setCamIp] = useState('192.168.1.100');
  const [camHttpPort, setCamHttpPort] = useState<number>(80);
  const [camRtspPort, setCamRtspPort] = useState<number>(554);
  const [camOnvifPort, setCamOnvifPort] = useState<number>(8000);
  const [camUsername, setCamUsername] = useState('admin');
  const [camPassword, setCamPassword] = useState('');
  const [camResolution, setCamResolution] = useState('4MP (2560x1440)');
  const [camCodec, setCamCodec] = useState('H.265+');
  const [camLens, setCamLens] = useState('2.8mm Grand Angle');
  const [camAudio, setCamAudio] = useState(false);
  const [camSwitchPort, setCamSwitchPort] = useState('Switch PoE Port 1');
  const [camNvrChannel, setCamNvrChannel] = useState<number>(1);
  const [camLocation, setCamLocation] = useState('');

  // NVR / DVR fields
  const [nvrBrand, setNvrBrand] = useState('Hikvision');
  const [nvrModel, setNvrModel] = useState('');
  const [nvrChannels, setNvrChannels] = useState<number>(16);
  const [nvrConnectedCams, setNvrConnectedCams] = useState<number>(8);
  const [nvrIp, setNvrIp] = useState('192.168.1.200');
  const [nvrHttpPort, setNvrHttpPort] = useState<number>(80);
  const [nvrServerPort, setNvrServerPort] = useState<number>(8000);
  const [nvrRtspPort, setNvrRtspPort] = useState<number>(554);
  const [nvrUsername, setNvrUsername] = useState('admin');
  const [nvrPassword, setNvrPassword] = useState('');
  const [nvrP2pId, setNvrP2pId] = useState('');
  const [nvrP2pVerifCode, setNvrP2pVerifCode] = useState('');
  const [nvrHddCapacity, setNvrHddCapacity] = useState<number>(8);
  const [nvrHddCount, setNvrHddCount] = useState<number>(2);
  const [nvrRetentionDays, setNvrRetentionDays] = useState<number>(30);
  const [nvrFirmware, setNvrFirmware] = useState('');

  // Router fields
  const [rtBrand, setRtBrand] = useState('MikroTik');
  const [rtModel, setRtModel] = useState('');
  const [rtFirmware, setRtFirmware] = useState('RouterOS v7.14');
  const [rtWanType, setRtWanType] = useState<'STATIC' | 'DHCP' | 'PPPOE' | 'STARLINK_BYPASS' | 'LTE_BACKUP'>('DHCP');
  const [rtWanIp, setRtWanIp] = useState('');
  const [rtLanGateway, setRtLanGateway] = useState('192.168.88.1/24');
  const [rtDhcpRange, setRtDhcpRange] = useState('192.168.88.10 - 192.168.88.250');
  const [rtDns, setRtDns] = useState('1.1.1.1, 8.8.8.8');
  const [rtAdminUser, setRtAdminUser] = useState('admin');
  const [rtAdminPassword, setRtAdminPassword] = useState('');
  const [rtWebPort, setRtWebPort] = useState<number>(80);
  const [rtSshPort, setRtSshPort] = useState<number>(22);
  const [rtVpnType, setRtVpnType] = useState<'WIREGUARD' | 'OPENVPN' | 'L2TP_IPSEC' | 'TAILSCALE' | 'NONE'>('WIREGUARD');
  const [rtVpnDetails, setRtVpnDetails] = useState('');
  const [rtVlans, setRtVlans] = useState('VLAN 10 (Admin), VLAN 20 (CCTV), VLAN 30 (Invités)');
  const [rtScript, setRtScript] = useState('');

  // Access Point fields
  const [apBrand, setApBrand] = useState('Ubiquiti (UniFi)');
  const [apModel, setApModel] = useState('UniFi U6 Pro');
  const [apIp, setApIp] = useState('192.168.1.50');
  const [apMac, setApMac] = useState('');
  const [apController, setApController] = useState('https://unifi.ui.com');
  const [apPrimarySsid, setApPrimarySsid] = useState('');
  const [apPrimaryPassword, setApPrimaryPassword] = useState('');
  const [apGuestSsid, setApGuestSsid] = useState('');
  const [apGuestPassword, setApGuestPassword] = useState('');
  const [apBands, setApBands] = useState('2.4GHz + 5GHz Wi-Fi 6');
  const [apPoe, setApPoe] = useState('802.3at PoE+');
  const [apAdminUser, setApAdminUser] = useState('admin');
  const [apAdminPassword, setApAdminPassword] = useState('');

  // Populate when editing
  useEffect(() => {
    if (equipmentToEdit) {
      setName(equipmentToEdit.name);
      setType(equipmentToEdit.type);
      setClientId(equipmentToEdit.clientId);
      setSiteName(equipmentToEdit.siteName);
      setSiteAddress(equipmentToEdit.siteAddress || '');
      setSerialNumber(equipmentToEdit.serialNumber);
      setMacAddress(equipmentToEdit.macAddress || '');
      setStatus(equipmentToEdit.status);
      setInstallationDate(equipmentToEdit.installationDate);
      setLastMaintenanceDate(equipmentToEdit.lastMaintenanceDate || '');
      setNextMaintenanceDate(equipmentToEdit.nextMaintenanceDate || '');
      setAssignedTechnician(equipmentToEdit.assignedTechnician || '');
      setNotes(equipmentToEdit.notes || '');
      setTagsInput(equipmentToEdit.tags ? equipmentToEdit.tags.join(', ') : '');

      if (equipmentToEdit.starlink) {
        setSlKitNumber(equipmentToEdit.starlink.kitNumber || '');
        setSlDishSerial(equipmentToEdit.starlink.dishSerial || '');
        setSlTerminalId(equipmentToEdit.starlink.terminalId || '');
        setSlAccountEmail(equipmentToEdit.starlink.accountEmail || '');
        setSlPlan(equipmentToEdit.starlink.subscriptionPlan || 'Standard Résidentiel RDC');
        setSlPublicIp(equipmentToEdit.starlink.publicIpOrCgnat || '');
        setSlBypass(Boolean(equipmentToEdit.starlink.bypassModeEnabled));
        setSlRouterModel(equipmentToEdit.starlink.routerModel || 'Starlink Gen 3 WiFi 6');
        setSlSsid(equipmentToEdit.starlink.wifiSsid || '');
        setSlPassword(equipmentToEdit.starlink.wifiPassword || '');
        setSlGps(equipmentToEdit.starlink.gpsCoordinates || '');
        setSlLatency(equipmentToEdit.starlink.averageLatencyMs || 45);
      }

      if (equipmentToEdit.cctvCamera) {
        setCamBrand(equipmentToEdit.cctvCamera.brand || 'Hikvision');
        setCamModel(equipmentToEdit.cctvCamera.model || '');
        setCamType(equipmentToEdit.cctvCamera.cameraType || 'DOME');
        setCamIp(equipmentToEdit.cctvCamera.ipAddress || '192.168.1.100');
        setCamHttpPort(equipmentToEdit.cctvCamera.httpPort || 80);
        setCamRtspPort(equipmentToEdit.cctvCamera.rtspPort || 554);
        setCamOnvifPort(equipmentToEdit.cctvCamera.onvifPort || 8000);
        setCamUsername(equipmentToEdit.cctvCamera.username || 'admin');
        setCamPassword(equipmentToEdit.cctvCamera.password || '');
        setCamResolution(equipmentToEdit.cctvCamera.resolution || '4MP (2560x1440)');
        setCamCodec(equipmentToEdit.cctvCamera.codec || 'H.265+');
        setCamLens(equipmentToEdit.cctvCamera.lensSize || '2.8mm Grand Angle');
        setCamAudio(Boolean(equipmentToEdit.cctvCamera.hasAudio));
        setCamSwitchPort(equipmentToEdit.cctvCamera.poeSwitchPort || '');
        setCamNvrChannel(equipmentToEdit.cctvCamera.nvrChannel || 1);
        setCamLocation(equipmentToEdit.cctvCamera.installedLocation || '');
      }

      if (equipmentToEdit.nvrDvr) {
        setNvrBrand(equipmentToEdit.nvrDvr.brand || 'Hikvision');
        setNvrModel(equipmentToEdit.nvrDvr.model || '');
        setNvrChannels(equipmentToEdit.nvrDvr.channelCount || 16);
        setNvrConnectedCams(equipmentToEdit.nvrDvr.connectedCamerasCount || 8);
        setNvrIp(equipmentToEdit.nvrDvr.ipAddress || '192.168.1.200');
        setNvrHttpPort(equipmentToEdit.nvrDvr.httpPort || 80);
        setNvrServerPort(equipmentToEdit.nvrDvr.serverPort || 8000);
        setNvrRtspPort(equipmentToEdit.nvrDvr.rtspPort || 554);
        setNvrUsername(equipmentToEdit.nvrDvr.username || 'admin');
        setNvrPassword(equipmentToEdit.nvrDvr.password || '');
        setNvrP2pId(equipmentToEdit.nvrDvr.p2pCloudId || '');
        setNvrP2pVerifCode(equipmentToEdit.nvrDvr.p2pVerificationCode || '');
        setNvrHddCapacity(equipmentToEdit.nvrDvr.hddCapacityTb || 8);
        setNvrHddCount(equipmentToEdit.nvrDvr.hddCount || 2);
        setNvrRetentionDays(equipmentToEdit.nvrDvr.retentionDays || 30);
        setNvrFirmware(equipmentToEdit.nvrDvr.firmwareVersion || '');
      }

      if (equipmentToEdit.router) {
        setRtBrand(equipmentToEdit.router.brand || 'MikroTik');
        setRtModel(equipmentToEdit.router.model || '');
        setRtFirmware(equipmentToEdit.router.firmwareOrOs || 'RouterOS v7.14');
        setRtWanType(equipmentToEdit.router.wanType || 'DHCP');
        setRtWanIp(equipmentToEdit.router.ipWan || '');
        setRtLanGateway(equipmentToEdit.router.ipLanGateway || '192.168.88.1/24');
        setRtDhcpRange(equipmentToEdit.router.dhcpPoolRange || '');
        setRtDns(equipmentToEdit.router.dnsServers || '1.1.1.1, 8.8.8.8');
        setRtAdminUser(equipmentToEdit.router.adminUsername || 'admin');
        setRtAdminPassword(equipmentToEdit.router.adminPassword || '');
        setRtWebPort(equipmentToEdit.router.winboxOrWebPort || 80);
        setRtSshPort(equipmentToEdit.router.sshPort || 22);
        setRtVpnType(equipmentToEdit.router.vpnType || 'WIREGUARD');
        setRtVpnDetails(equipmentToEdit.router.vpnConfigDetails || '');
        setRtVlans(equipmentToEdit.router.activeVlans || '');
        setRtScript(equipmentToEdit.router.backupConfigScript || '');
      }

      if (equipmentToEdit.accessPoint) {
        setApBrand(equipmentToEdit.accessPoint.brand || 'Ubiquiti (UniFi)');
        setApModel(equipmentToEdit.accessPoint.model || 'UniFi U6 Pro');
        setApIp(equipmentToEdit.accessPoint.ipAddress || '192.168.1.50');
        setApMac(equipmentToEdit.accessPoint.macAddress || '');
        setApController(equipmentToEdit.accessPoint.controllerIpOrCloud || '');
        setApPrimarySsid(equipmentToEdit.accessPoint.primarySsid || '');
        setApPrimaryPassword(equipmentToEdit.accessPoint.primaryWifiPassword || '');
        setApGuestSsid(equipmentToEdit.accessPoint.guestSsid || '');
        setApGuestPassword(equipmentToEdit.accessPoint.guestWifiPassword || '');
        setApBands(equipmentToEdit.accessPoint.frequencyBands || '2.4GHz + 5GHz Wi-Fi 6');
        setApPoe(equipmentToEdit.accessPoint.powerPoeRequirement || '802.3at PoE+');
        setApAdminUser(equipmentToEdit.accessPoint.adminUsername || 'admin');
        setApAdminPassword(equipmentToEdit.accessPoint.adminPassword || '');
      }
    } else {
      // Defaults for new equipment
      setName('');
      setType(defaultType);
      setClientId(clients[0]?.id || '');
      setSiteName('Site Principal');
      setSiteAddress(clients[0]?.address || 'Lubumbashi, RDC');
      setSerialNumber(`SN-${Date.now().toString().slice(-6)}`);
      setMacAddress('');
      setStatus('ACTIVE');
      setInstallationDate(new Date().toISOString().slice(0, 10));
      setLastMaintenanceDate('');
      setNextMaintenanceDate('');
      setAssignedTechnician('Ingénieur Réseau HibTech');
      setNotes('');
      setTagsInput('');

      // Starlink defaults
      setSlKitNumber(`KIT00${Math.floor(100000 + Math.random() * 900000)}`);
      setSlDishSerial(`2UT${Date.now().toString().slice(-10)}`);
      setSlTerminalId(`01000000-00000000-00${Date.now().toString().slice(-6)}`);
      setSlAccountEmail(clients[0]?.email || 'client@domain.cd');
      setSlPlan('Standard Résidentiel RDC');
      setSlPublicIp('');
      setSlBypass(false);
      setSlRouterModel('Starlink Gen 3 WiFi 6');
      setSlSsid(`Starlink_${clients[0]?.name.replace(/\s+/g, '_') || 'Guest'}`);
      setSlPassword('Starlink#SecurePass2024!');
      setSlGps('-11.6609, 27.4794 (Lubumbashi)');
      setSlLatency(45);
    }
  }, [equipmentToEdit, defaultType, clients]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedClient = clients.find((c) => c.id === clientId);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Build specifics
    let starlinkData: StarlinkSpecifics | undefined;
    if (type === 'STARLINK') {
      starlinkData = {
        kitNumber: slKitNumber,
        dishSerial: slDishSerial,
        terminalId: slTerminalId,
        accountEmail: slAccountEmail,
        subscriptionPlan: slPlan,
        publicIpOrCgnat: slPublicIp,
        bypassModeEnabled: slBypass,
        routerModel: slRouterModel,
        wifiSsid: slSsid,
        wifiPassword: slPassword,
        gpsCoordinates: slGps,
        averageLatencyMs: slLatency,
      };
    }

    let cctvData: CctvCameraSpecifics | undefined;
    if (type === 'CCTV_CAMERA') {
      cctvData = {
        brand: camBrand,
        model: camModel,
        cameraType: camType,
        ipAddress: camIp,
        httpPort: camHttpPort,
        rtspPort: camRtspPort,
        onvifPort: camOnvifPort,
        username: camUsername,
        password: camPassword,
        resolution: camResolution,
        codec: camCodec,
        lensSize: camLens,
        hasAudio: camAudio,
        poeSwitchPort: camSwitchPort,
        nvrChannel: camNvrChannel,
        installedLocation: camLocation,
      };
    }

    let nvrData: NvrDvrSpecifics | undefined;
    if (type === 'NVR_DVR') {
      nvrData = {
        brand: nvrBrand,
        model: nvrModel,
        channelCount: nvrChannels,
        connectedCamerasCount: nvrConnectedCams,
        ipAddress: nvrIp,
        httpPort: nvrHttpPort,
        serverPort: nvrServerPort,
        rtspPort: nvrRtspPort,
        username: nvrUsername,
        password: nvrPassword,
        p2pCloudId: nvrP2pId,
        p2pVerificationCode: nvrP2pVerifCode,
        hddCapacityTb: nvrHddCapacity,
        hddCount: nvrHddCount,
        retentionDays: nvrRetentionDays,
        firmwareVersion: nvrFirmware,
      };
    }

    let routerData: RouterSpecifics | undefined;
    if (type === 'ROUTER') {
      routerData = {
        brand: rtBrand,
        model: rtModel,
        firmwareOrOs: rtFirmware,
        wanType: rtWanType,
        ipWan: rtWanIp,
        ipLanGateway: rtLanGateway,
        dhcpPoolRange: rtDhcpRange,
        dnsServers: rtDns,
        adminUsername: rtAdminUser,
        adminPassword: rtAdminPassword,
        winboxOrWebPort: rtWebPort,
        sshPort: rtSshPort,
        vpnType: rtVpnType,
        vpnConfigDetails: rtVpnDetails,
        activeVlans: rtVlans,
        backupConfigScript: rtScript,
      };
    }

    let apData: AccessPointSpecifics | undefined;
    if (type === 'ACCESS_POINT') {
      apData = {
        brand: apBrand,
        model: apModel,
        ipAddress: apIp,
        macAddress: apMac || macAddress,
        controllerIpOrCloud: apController,
        primarySsid: apPrimarySsid,
        primaryWifiPassword: apPrimaryPassword,
        guestSsid: apGuestSsid,
        guestWifiPassword: apGuestPassword,
        frequencyBands: apBands,
        powerPoeRequirement: apPoe,
        adminUsername: apAdminUser,
        adminPassword: apAdminPassword,
      };
    }

    const payload = {
      name: name || `${type} - ${siteName}`,
      type,
      clientId: clientId || clients[0]?.id || 'comptoir',
      clientName: selectedClient ? selectedClient.name : 'Client Comptoir',
      siteName: siteName || 'Site Principal',
      siteAddress: siteAddress || selectedClient?.address || 'Lubumbashi, RDC',
      serialNumber: serialNumber || `SN-${Date.now()}`,
      macAddress,
      status,
      installationDate: installationDate || new Date().toISOString().slice(0, 10),
      lastMaintenanceDate,
      nextMaintenanceDate,
      assignedTechnician,
      notes,
      tags: parsedTags,
      starlink: starlinkData,
      cctvCamera: cctvData,
      nvrDvr: nvrData,
      router: routerData,
      accessPoint: apData,
    };

    if (equipmentToEdit) {
      updateEquipment(equipmentToEdit.id, payload);
    } else {
      addEquipment(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto font-sans">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-neutral-950 rounded-xl">
              {type === 'STARLINK' ? (
                <Radio className="w-5 h-5" />
              ) : type === 'CCTV_CAMERA' ? (
                <Video className="w-5 h-5" />
              ) : type === 'NVR_DVR' ? (
                <HardDrive className="w-5 h-5" />
              ) : type === 'ROUTER' ? (
                <RouterIcon className="w-5 h-5" />
              ) : (
                <Wifi className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg tracking-tight">
                {equipmentToEdit ? `Modifier l'Équipement : ${equipmentToEdit.name}` : "Ajouter un Équipement au Parc Réseau"}
              </h3>
              <p className="text-xs text-neutral-400">
                Gestion des configurations techniques, adresses IP, identifiants et maintenance
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Top Selector: Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
            {/* Equipment Type */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Type d'Équipement *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as EquipmentType)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="STARLINK">Kit Starlink Satellite</option>
                <option value="CCTV_CAMERA">Caméra de Surveillance (CCTV)</option>
                <option value="NVR_DVR">Enregistreur NVR / DVR / XVR</option>
                <option value="ROUTER">Routeur / Pare-feu (MikroTik/Cisco)</option>
                <option value="ACCESS_POINT">Point d'Accès Wi-Fi (UniFi/AP)</option>
                <option value="SWITCH_OTHER">Switch PoE / Autre Équipement</option>
              </select>
            </div>

            {/* Client */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Client / Entreprise Assigné *
              </label>
              <select
                value={clientId}
                onChange={(e) => {
                  setClientId(e.target.value);
                  const cl = clients.find((c) => c.id === e.target.value);
                  if (cl && cl.address) setSiteAddress(cl.address);
                }}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-semibold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.type === 'COMPANY' ? '(Entreprise)' : '(Particulier)'}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 uppercase tracking-wider mb-1">
                Statut Opérationnel *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
              >
                <option value="ACTIVE">🟢 En Service (Opérationnel)</option>
                <option value="MAINTENANCE">🟡 En Maintenance / Test</option>
                <option value="OFFLINE">🔴 Hors Ligne / Incident</option>
                <option value="IN_STOCK">📦 En Stock Magasin</option>
              </select>
            </div>
          </div>

          {/* Section 1: General Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-800 pb-1 border-b border-neutral-200 flex items-center gap-2">
              <Info className="w-3.5 h-3.5 text-neutral-500" />
              <span>Informations Générales & Localisation</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Nom Usuel de l'Équipement *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Kit Starlink V3 - Base Vie Kolwezi"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Nom du Site / Emplacement Précis *
                </label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="Ex: Siège Principal / Datacenter RDC"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Adresse Physique du Site
                </label>
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  placeholder="Ex: Boulevard du 30 Juin, RDC"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Numéro de Série (S/N) *
                </label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Ex: KIT-SL-2024-88492"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none font-mono-nums font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Adresse MAC (Optionnel)
                </label>
                <input
                  type="text"
                  value={macAddress}
                  onChange={(e) => setMacAddress(e.target.value)}
                  placeholder="Ex: 70:EE:50:2A:9C:14"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-neutral-600 font-semibold mb-1">
                  Ingénieur / Technicien Responsable
                </label>
                <input
                  type="text"
                  value={assignedTechnician}
                  onChange={(e) => setAssignedTechnician(e.target.value)}
                  placeholder="Ex: Ing. Christian Kabwe"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Type Specific Configuration */}
          {type === 'STARLINK' && (
            <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sky-900 font-bold uppercase text-[11px]">
                <Radio className="w-4 h-4 text-sky-600" />
                <span>Configuration Spécifique : Kit Starlink Satellite</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Numéro de Kit (Kit Number)</label>
                  <input
                    type="text"
                    value={slKitNumber}
                    onChange={(e) => setSlKitNumber(e.target.value)}
                    placeholder="KIT00392817"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">N° Série Antenne (Dish Serial)</label>
                  <input
                    type="text"
                    value={slDishSerial}
                    onChange={(e) => setSlDishSerial(e.target.value)}
                    placeholder="2UT14983082910"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Terminal ID (UT ID)</label>
                  <input
                    type="text"
                    value={slTerminalId}
                    onChange={(e) => setSlTerminalId(e.target.value)}
                    placeholder="01000000-00000000-0062a4bf"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Compte Starlink (Email)</label>
                  <input
                    type="email"
                    value={slAccountEmail}
                    onChange={(e) => setSlAccountEmail(e.target.value)}
                    placeholder="it@entreprise.cd"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Formule / Forfait d'Abonnement</label>
                  <select
                    value={slPlan}
                    onChange={(e) => setSlPlan(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  >
                    <option value="Standard Résidentiel RDC">Standard Résidentiel RDC</option>
                    <option value="Priorité Entreprise 1TB (Business)">Priorité Entreprise 1TB (Business)</option>
                    <option value="Priorité Entreprise 2TB (Business)">Priorité Entreprise 2TB (Business)</option>
                    <option value="Mobile / Itinérance Régionale (Roam)">Mobile / Itinérance Régionale (Roam)</option>
                    <option value="Mobile Priorité Maritime/Véhicule">Mobile Priorité Maritime/Véhicule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Adresse IP (Publique ou CGNAT)</label>
                  <input
                    type="text"
                    value={slPublicIp}
                    onChange={(e) => setSlPublicIp(e.target.value)}
                    placeholder="Ex: 102.164.88.42 ou CGNAT"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">SSID Wi-Fi</label>
                  <input
                    type="text"
                    value={slSsid}
                    onChange={(e) => setSlSsid(e.target.value)}
                    placeholder="Starlink_Office_WiFi"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Mot de Passe Wi-Fi</label>
                  <input
                    type="text"
                    value={slPassword}
                    onChange={(e) => setSlPassword(e.target.value)}
                    placeholder="CleWPA2Starlink2024!"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Coordonnées GPS / Obstruction</label>
                  <input
                    type="text"
                    value={slGps}
                    onChange={(e) => setSlGps(e.target.value)}
                    placeholder="-4.3317, 15.3139 (0% obstruction)"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Bypass Mode Checkbox */}
              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bypassCheck"
                  checked={slBypass}
                  onChange={(e) => setSlBypass(e.target.checked)}
                  className="w-4 h-4 accent-sky-600 rounded cursor-pointer"
                />
                <label htmlFor="bypassCheck" className="text-xs font-bold text-sky-950 cursor-pointer">
                  Mode Bypass (Pass-Through) activé vers un routeur tiers (MikroTik / Cisco / UniFi)
                </label>
              </div>
            </div>
          )}

          {type === 'CCTV_CAMERA' && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold uppercase text-[11px]">
                <Video className="w-4 h-4 text-emerald-600" />
                <span>Configuration Caméra de Surveillance (CCTV IP)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Marque & Modèle</label>
                  <input
                    type="text"
                    value={camBrand}
                    onChange={(e) => setCamBrand(e.target.value)}
                    placeholder="Hikvision / Dahua / Uniview"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Type de Caméra</label>
                  <select
                    value={camType}
                    onChange={(e) => setCamType(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="DOME">Dôme Antivandale</option>
                    <option value="BULLET">Tube / Bullet Extérieur</option>
                    <option value="PTZ">PTZ Motorisée (360° + Zoom)</option>
                    <option value="EYEBALL">Tourelle / Eyeball</option>
                    <option value="PANORAMIC">Panoramique / Fisheye 180°/360°</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Adresse IP Fixe (LAN)</label>
                  <input
                    type="text"
                    value={camIp}
                    onChange={(e) => setCamIp(e.target.value)}
                    placeholder="192.168.1.100"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Nom d'Utilisateur Admin</label>
                  <input
                    type="text"
                    value={camUsername}
                    onChange={(e) => setCamUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Mot de Passe Caméra</label>
                  <input
                    type="text"
                    value={camPassword}
                    onChange={(e) => setCamPassword(e.target.value)}
                    placeholder="PassCam2024!"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Résolution / Capteur</label>
                  <select
                    value={camResolution}
                    onChange={(e) => setCamResolution(e.target.value)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-medium"
                  >
                    <option value="2MP (1080p Full HD)">2MP (1080p Full HD)</option>
                    <option value="4MP (2K Quad HD)">4MP (2K Quad HD)</option>
                    <option value="5MP Super HD">5MP Super HD</option>
                    <option value="8MP (4K Ultra HD)">8MP (4K Ultra HD)</option>
                    <option value="12MP Ultra">12MP Ultra</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Canal NVR Assigné</label>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    value={camNvrChannel}
                    onChange={(e) => setCamNvrChannel(parseInt(e.target.value) || 1)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Port Switch PoE Lié</label>
                  <input
                    type="text"
                    value={camSwitchPort}
                    onChange={(e) => setCamSwitchPort(e.target.value)}
                    placeholder="Switch Core Port 1"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Emplacement Surveillé</label>
                  <input
                    type="text"
                    value={camLocation}
                    onChange={(e) => setCamLocation(e.target.value)}
                    placeholder="Ex: Entrée Principale / Caisse"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="camAudioCheck"
                  checked={camAudio}
                  onChange={(e) => setCamAudio(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                />
                <label htmlFor="camAudioCheck" className="text-xs font-semibold text-emerald-950 cursor-pointer">
                  Microphone / Enregistrement Audio Intégré activé
                </label>
              </div>
            </div>
          )}

          {type === 'NVR_DVR' && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold uppercase text-[11px]">
                <HardDrive className="w-4 h-4 text-purple-600" />
                <span>Configuration Enregistreur Vidéo (NVR / DVR / XVR)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Marque & Modèle</label>
                  <input
                    type="text"
                    value={nvrBrand}
                    onChange={(e) => setNvrBrand(e.target.value)}
                    placeholder="Hikvision DS-7732NXI-I4"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Nombre de Canaux</label>
                  <select
                    value={nvrChannels}
                    onChange={(e) => setNvrChannels(parseInt(e.target.value))}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                  >
                    <option value={4}>4 Canaux</option>
                    <option value={8}>8 Canaux</option>
                    <option value={16}>16 Canaux</option>
                    <option value={32}>32 Canaux</option>
                    <option value={64}>64 Canaux</option>
                    <option value={128}>128 Canaux</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Adresse IP LAN</label>
                  <input
                    type="text"
                    value={nvrIp}
                    onChange={(e) => setNvrIp(e.target.value)}
                    placeholder="192.168.1.200"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Utilisateur Admin</label>
                  <input
                    type="text"
                    value={nvrUsername}
                    onChange={(e) => setNvrUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Mot de Passe Admin NVR</label>
                  <input
                    type="text"
                    value={nvrPassword}
                    onChange={(e) => setNvrPassword(e.target.value)}
                    placeholder="NvrPass2024!"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Identifiant Cloud P2P (Hik-Connect/DMSS)</label>
                  <input
                    type="text"
                    value={nvrP2pId}
                    onChange={(e) => setNvrP2pId(e.target.value)}
                    placeholder="Ex: HIK-992810"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold text-purple-900"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Code Vérification P2P</label>
                  <input
                    type="text"
                    value={nvrP2pVerifCode}
                    onChange={(e) => setNvrP2pVerifCode(e.target.value)}
                    placeholder="Ex: ABCDEF"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Capacité Disques Durs (TB Total)</label>
                  <input
                    type="number"
                    min="1"
                    max="128"
                    value={nvrHddCapacity}
                    onChange={(e) => setNvrHddCapacity(parseFloat(e.target.value) || 4)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Rétention Vidéo (Jours)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={nvrRetentionDays}
                    onChange={(e) => setNvrRetentionDays(parseInt(e.target.value) || 30)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>
              </div>
            </div>
          )}

          {type === 'ROUTER' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold uppercase text-[11px]">
                <RouterIcon className="w-4 h-4 text-amber-600" />
                <span>Configuration Routeur / Passerelle (MikroTik / Cisco / UniFi)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Marque & Modèle</label>
                  <input
                    type="text"
                    value={rtBrand}
                    onChange={(e) => setRtBrand(e.target.value)}
                    placeholder="MikroTik CCR2004 / RB5009"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Système / Firmware</label>
                  <input
                    type="text"
                    value={rtFirmware}
                    onChange={(e) => setRtFirmware(e.target.value)}
                    placeholder="RouterOS v7.14"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Type de Connexion WAN</label>
                  <select
                    value={rtWanType}
                    onChange={(e) => setRtWanType(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="STARLINK_BYPASS">Starlink Bypass (DHCP Auto)</option>
                    <option value="DHCP">DHCP Client (Fibre/Modem)</option>
                    <option value="STATIC">IP Publique Statique Fixe</option>
                    <option value="PPPOE">PPPoE Client (Identifiant FAI)</option>
                    <option value="LTE_BACKUP">Secours 4G/LTE Backup</option>
                  </select>
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Passerelle LAN (IP / Masque)</label>
                  <input
                    type="text"
                    value={rtLanGateway}
                    onChange={(e) => setRtLanGateway(e.target.value)}
                    placeholder="192.168.88.1/24"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Plage DHCP LAN</label>
                  <input
                    type="text"
                    value={rtDhcpRange}
                    onChange={(e) => setRtDhcpRange(e.target.value)}
                    placeholder="192.168.88.10 - 192.168.88.250"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Serveurs DNS</label>
                  <input
                    type="text"
                    value={rtDns}
                    onChange={(e) => setRtDns(e.target.value)}
                    placeholder="1.1.1.1, 8.8.8.8"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Identifiant Admin</label>
                  <input
                    type="text"
                    value={rtAdminUser}
                    onChange={(e) => setRtAdminUser(e.target.value)}
                    placeholder="admin"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Mot de Passe Admin</label>
                  <input
                    type="text"
                    value={rtAdminPassword}
                    onChange={(e) => setRtAdminPassword(e.target.value)}
                    placeholder="RouterSecret2024!"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Protocole VPN</label>
                  <select
                    value={rtVpnType}
                    onChange={(e) => setRtVpnType(e.target.value as any)}
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="WIREGUARD">WireGuard VPN (Moderne & Rapide)</option>
                    <option value="L2TP_IPSEC">L2TP / IPsec</option>
                    <option value="OPENVPN">OpenVPN</option>
                    <option value="TAILSCALE">Tailscale / ZeroTier</option>
                    <option value="NONE">Aucun VPN</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Détails VLANs & Segments</label>
                <input
                  type="text"
                  value={rtVlans}
                  onChange={(e) => setRtVlans(e.target.value)}
                  placeholder="VLAN 10 (Admin), VLAN 20 (CCTV), VLAN 30 (Invités)"
                  className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>

              <div>
                <label className="block text-neutral-700 font-semibold mb-1">Extrait Script Configuration / Règles</label>
                <textarea
                  rows={2}
                  value={rtScript}
                  onChange={(e) => setRtScript(e.target.value)}
                  placeholder="/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade..."
                  className="w-full bg-white border border-neutral-300 rounded-lg p-2.5 text-xs font-mono text-neutral-800"
                />
              </div>
            </div>
          )}

          {type === 'ACCESS_POINT' && (
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-bold uppercase text-[11px]">
                <Wifi className="w-4 h-4 text-teal-600" />
                <span>Configuration Point d'Accès Wi-Fi (UniFi / Omada / Cambium)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Marque & Modèle AP</label>
                  <input
                    type="text"
                    value={apBrand}
                    onChange={(e) => setApBrand(e.target.value)}
                    placeholder="Ubiquiti UniFi U6 Pro"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Adresse IP de Gestion</label>
                  <input
                    type="text"
                    value={apIp}
                    onChange={(e) => setApIp(e.target.value)}
                    placeholder="192.168.1.50"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums font-bold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Contrôleur Cloud / IP</label>
                  <input
                    type="text"
                    value={apController}
                    onChange={(e) => setApController(e.target.value)}
                    placeholder="https://unifi.ui.com"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">SSID Wi-Fi Principal</label>
                  <input
                    type="text"
                    value={apPrimarySsid}
                    onChange={(e) => setApPrimarySsid(e.target.value)}
                    placeholder="Entreprise_Secure_WiFi"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">Mot de Passe Wi-Fi Principal</label>
                  <input
                    type="text"
                    value={apPrimaryPassword}
                    onChange={(e) => setApPrimaryPassword(e.target.value)}
                    placeholder="WiFi#SecurePass2024!"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs font-mono-nums"
                  />
                </div>

                <div>
                  <label className="block text-neutral-700 font-semibold mb-1">SSID Invités / Visiteurs</label>
                  <input
                    type="text"
                    value={apGuestSsid}
                    onChange={(e) => setApGuestSsid(e.target.value)}
                    placeholder="Entreprise_GUEST"
                    className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 3: Dates, Notes & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Date d'Installation</label>
              <input
                type="date"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Dernière Maintenance</label>
              <input
                type="date"
                value={lastMaintenanceDate}
                onChange={(e) => setLastMaintenanceDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-neutral-700 font-semibold mb-1">Prochaine Révision Prévue</label>
              <input
                type="date"
                value={nextMaintenanceDate}
                onChange={(e) => setNextMaintenanceDate(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-700 font-semibold mb-1">Tags / Étiquettes (séparés par des virgules)</label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Starlink, Kolwezi, Priorité 1TB, Backup"
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg px-3 py-2 text-xs text-neutral-900 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-neutral-700 font-semibold mb-1">Notes Techniques & Instructions d'Intervention</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Consignes particulières, schéma de câblage, raccordement onduleur..."
              className="w-full bg-neutral-50 border border-neutral-300 rounded-lg p-3 text-xs text-neutral-900 focus:bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-neutral-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Annuler
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-2"
            >
              <Check className="w-4 h-4 text-amber-400" />
              <span>{equipmentToEdit ? "Enregistrer les Modifications" : "Ajouter l'Équipement"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
