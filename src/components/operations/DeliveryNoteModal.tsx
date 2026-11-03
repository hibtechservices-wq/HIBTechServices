import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryNote, DeliveryItem, DeliveryStatus } from '../../types';
import { Truck, X, Plus, Trash2, ShieldCheck, Package, CheckCircle2, User, Phone, MapPin } from 'lucide-react';

interface DeliveryNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteToEdit?: DeliveryNote | null;
}

export const DeliveryNoteModal: React.FC<DeliveryNoteModalProps> = ({
  isOpen,
  onClose,
  noteToEdit,
}) => {
  const { clients, sales, addDeliveryNote, updateDeliveryNote } = useApp();

  const [deliveryNumber, setDeliveryNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [saleNumber, setSaleNumber] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [siteName, setSiteName] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<DeliveryStatus>('PENDING');
  const [transporterName, setTransporterName] = useState('Alain Kalombo (Logistique HibTech)');
  const [transporterPhone, setTransporterPhone] = useState('+243 81 990 1122');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientTitle, setRecipientTitle] = useState('');
  const [dischargeNotes, setDischargeNotes] = useState('');
  const [signedByClient, setSignedByClient] = useState(false);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<DeliveryItem[]>([]);

  // Item form input
  const [itemName, setItemName] = useState('');
  const [itemSerial, setItemSerial] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemCondition, setItemCondition] = useState<DeliveryItem['condition']>('NEUF_SOUS_BLISTER');
  const [itemAccessories, setItemAccessories] = useState('');

  useEffect(() => {
    if (noteToEdit) {
      setDeliveryNumber(noteToEdit.deliveryNumber);
      setClientId(noteToEdit.clientId);
      setSaleNumber(noteToEdit.saleNumber || '');
      setDeliveryAddress(noteToEdit.deliveryAddress);
      setSiteName(noteToEdit.siteName || '');
      setDate(noteToEdit.date);
      setStatus(noteToEdit.status);
      setTransporterName(noteToEdit.transporterName);
      setTransporterPhone(noteToEdit.transporterPhone || '');
      setVehiclePlate(noteToEdit.vehiclePlate || '');
      setRecipientName(noteToEdit.recipientName || '');
      setRecipientTitle(noteToEdit.recipientTitle || '');
      setDischargeNotes(noteToEdit.dischargeNotes || '');
      setSignedByClient(noteToEdit.signedByClient);
      setNotes(noteToEdit.notes || '');
      setItems(noteToEdit.items || []);
    } else {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setDeliveryNumber(`BL-2026-${randomSuffix}`);
      setClientId(clients[0]?.id || '');
      setSaleNumber('');
      setDeliveryAddress(clients[0]?.address || '');
      setSiteName('Site Principal');
      setDate(new Date().toISOString().split('T')[0]);
      setStatus('PENDING');
      setTransporterName('Alain Kalombo (Logistique HibTech)');
      setTransporterPhone('+243 81 990 1122');
      setVehiclePlate('KN 8492 BG 01');
      setRecipientName('');
      setRecipientTitle('');
      setDischargeNotes('Matériel réceptionné complet et conforme.');
      setSignedByClient(false);
      setNotes('');
      setItems([
        {
          id: `item-${Date.now()}-1`,
          name: 'Kit Starlink V3 Haut Débit Motorisé (Antenne + Routeur + Câble 25m)',
          serialNumber: 'KIT-SL-2026-00918',
          quantity: 1,
          accessories: ['Adaptateur Ethernet Gigabit', 'Support mât toiture', 'Bloc alim 220V'],
          condition: 'NEUF_SOUS_BLISTER',
        },
      ]);
    }
  }, [noteToEdit, isOpen, clients]);

  // When client changes, auto-fill address
  const handleClientChange = (cId: string) => {
    setClientId(cId);
    const c = clients.find((client) => client.id === cId);
    if (c) {
      setDeliveryAddress(`${c.address || ''} ${c.city || 'Lubumbashi'}`.trim());
    }
  };

  // Pre-fill items from linked sale if selected
  const handleSaleChange = (saleNum: string) => {
    setSaleNumber(saleNum);
    const sale = sales.find((s) => s.saleNumber === saleNum);
    if (sale && sale.items.length > 0) {
      const generatedItems: DeliveryItem[] = sale.items.map((it, idx) => ({
        id: `item-sale-${Date.now()}-${idx}`,
        name: it.name,
        serialNumber: it.code || '',
        quantity: it.quantity,
        accessories: ['Accessoires standards d\'origine'],
        condition: 'NEUF_SOUS_BLISTER',
      }));
      setItems(generatedItems);
      if (sale.clientId) {
        handleClientChange(sale.clientId);
      }
    }
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    const accArray = itemAccessories
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0);

    const newItem: DeliveryItem = {
      id: `item-${Date.now()}`,
      name: itemName.trim(),
      serialNumber: itemSerial.trim() || undefined,
      quantity: Math.max(1, itemQty),
      condition: itemCondition,
      accessories: accArray.length > 0 ? accArray : undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setItemName('');
    setItemSerial('');
    setItemQty(1);
    setItemAccessories('');
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === clientId);
    const clientName = client?.name || 'Client';
    const clientPhone = client?.phone || '';

    const payload = {
      deliveryNumber,
      saleNumber: saleNumber.trim() || undefined,
      clientId,
      clientName,
      clientPhone,
      deliveryAddress,
      siteName,
      date,
      status,
      transporterName,
      transporterPhone,
      vehiclePlate,
      recipientName,
      recipientTitle,
      deliveredAt: status === 'DELIVERED' ? new Date().toLocaleString('fr-FR') : undefined,
      dischargeNotes,
      signedByClient,
      notes,
      items,
    };

    if (noteToEdit) {
      updateDeliveryNote(noteToEdit.id, payload);
    } else {
      addDeliveryNote(payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-neutral-200 overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-neutral-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-400 text-neutral-950 rounded-xl">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {noteToEdit ? `Modifier le Bon de Livraison ${noteToEdit.deliveryNumber}` : 'Nouveau Bon de Livraison (BL) & Décharge'}
              </h2>
              <p className="text-xs text-neutral-400">
                Remise officielle d'équipements réseaux, Starlink et matériel informatique
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 text-xs text-neutral-800">
          {/* Top row: BL number, date, status, linked sale */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-neutral-50 p-4 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                N° Bon de Livraison (BL)
              </label>
              <input
                type="text"
                required
                value={deliveryNumber}
                onChange={(e) => setDeliveryNumber(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-mono font-bold text-neutral-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                Date de Livraison
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                Statut Livraison
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as DeliveryStatus)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-bold"
              >
                <option value="PENDING">🟡 En attente de départ</option>
                <option value="IN_TRANSIT">🚚 En transit / En cours</option>
                <option value="DELIVERED">🟢 Livré & Déchargé</option>
                <option value="CANCELLED">⚪ Annulé</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                Lié à la Facture (Opt.)
              </label>
              <select
                value={saleNumber}
                onChange={(e) => handleSaleChange(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-medium"
              >
                <option value="">-- Aucune / Vente libre --</option>
                {sales.slice(0, 20).map((s) => (
                  <option key={s.id} value={s.saleNumber}>
                    {s.saleNumber} ({s.clientName.substring(0, 14)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client & Destination */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Client Destinataire
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-bold"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Nom du Site d'Installation
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Ex: Siège Principal / Villa Macampagne"
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-700 uppercase mb-1">
                Adresse Physique de Livraison
              </label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Ex: 142 Boulevard du 30 Juin"
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5"
              />
            </div>
          </div>

          {/* Transporter & Vehicle */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-neutral-50 p-3.5 rounded-xl border border-neutral-200">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                Livreur / Transporteur Assigné
              </label>
              <input
                type="text"
                value={transporterName}
                onChange={(e) => setTransporterName(e.target.value)}
                placeholder="Nom du livreur"
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                Téléphone Livreur
              </label>
              <input
                type="text"
                value={transporterPhone}
                onChange={(e) => setTransporterPhone(e.target.value)}
                placeholder="+243..."
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                Véhicule / Plaque d'Immatriculation
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                placeholder="Ex: KN 8492 BG 01 / Moto"
                className="w-full bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-neutral-900 uppercase tracking-wide">
                Équipements & Matériels Livrés ({items.length})
              </label>
              <span className="text-[11px] text-neutral-500">
                Spécifiez les numéros de série et accessoires pour la décharge
              </span>
            </div>

            <div className="border border-neutral-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100 text-neutral-700 font-bold border-b border-neutral-200">
                  <tr>
                    <th className="py-2 px-3">Désignation du Matériel</th>
                    <th className="py-2 px-3">N° Série (S/N)</th>
                    <th className="py-2 px-2 text-center w-16">Qté</th>
                    <th className="py-2 px-3">État</th>
                    <th className="py-2 px-3">Accessoires fournis</th>
                    <th className="py-2 px-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {items.map((it) => (
                    <tr key={it.id} className="hover:bg-neutral-50/80">
                      <td className="py-2 px-3 font-semibold text-neutral-900">{it.name}</td>
                      <td className="py-2 px-3 font-mono text-neutral-600">{it.serialNumber || 'N/A'}</td>
                      <td className="py-2 px-2 text-center font-bold">{it.quantity}</td>
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {it.condition === 'NEUF_SOUS_BLISTER' ? 'Neuf blister' : it.condition === 'TESTE_ET_FONCTIONNEL' ? 'Testé OK' : 'Occasion'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-neutral-500 text-[11px]">
                        {it.accessories && it.accessories.length > 0 ? it.accessories.join(', ') : 'Aucun'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-neutral-400 hover:text-red-600 p-1 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-neutral-400">
                        Aucun matériel ajouté. Utilisez le formulaire ci-dessous.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Add item inline bar */}
            <div className="p-3 bg-neutral-100 rounded-xl space-y-2">
              <p className="text-[11px] font-bold text-neutral-700">Ajouter un équipement au Bon de Livraison :</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Désignation (ex: Kit Starlink V3, Caméra Dahua...)"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="sm:col-span-4 bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs"
                />
                <input
                  type="text"
                  placeholder="N° Série / MAC (ex: KIT-SL-2026...)"
                  value={itemSerial}
                  onChange={(e) => setItemSerial(e.target.value)}
                  className="sm:col-span-3 bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs font-mono"
                />
                <input
                  type="number"
                  min="1"
                  value={itemQty}
                  onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                  className="sm:col-span-1 bg-white border border-neutral-300 rounded px-2 py-1 text-xs text-center font-bold"
                />
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value as any)}
                  className="sm:col-span-2 bg-white border border-neutral-300 rounded px-2 py-1 text-xs font-semibold"
                >
                  <option value="NEUF_SOUS_BLISTER">Neuf sous blister</option>
                  <option value="TESTE_ET_FONCTIONNEL">Testé et fonctionnel</option>
                  <option value="OCCASION_REVISEE">Occasion révisée</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="sm:col-span-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded px-2 py-1 text-xs flex items-center justify-center gap-1 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="Accessoires inclus séparés par des virgules (ex: Câble 25m, Mât toiture, Injecteur PoE, Cordon alim)"
                value={itemAccessories}
                onChange={(e) => setItemAccessories(e.target.value)}
                className="w-full bg-white border border-neutral-300 rounded px-2.5 py-1 text-xs text-neutral-600"
              />
            </div>
          </div>

          {/* Discharge & Signature details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/70 p-4 rounded-xl border border-amber-200">
            <div>
              <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                Nom & Fonction du Réceptionnaire Client
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nom réceptionnaire"
                  className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  placeholder="Titre (ex: Resp IT)"
                  className="bg-white border border-neutral-300 rounded-lg px-2.5 py-1.5"
                />
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={signedByClient}
                  onChange={(e) => setSignedByClient(e.target.checked)}
                  className="rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-neutral-900">Signé et déchargé par le client</span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-950 uppercase mb-1">
                Mention de Décharge Légale
              </label>
              <textarea
                rows={2}
                value={dischargeNotes}
                onChange={(e) => setDischargeNotes(e.target.value)}
                placeholder="Ex: Le client soussigné atteste avoir réceptionné ce jour le matériel ci-dessus en parfait état de fonctionnement..."
                className="w-full bg-white border border-neutral-300 rounded-lg p-2 text-neutral-900 focus:outline-none text-[11px]"
              />
            </div>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-xl text-neutral-700 hover:bg-neutral-100 font-semibold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold flex items-center gap-2 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{noteToEdit ? 'Enregistrer les Modifications' : 'Créer le Bon de Livraison'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
