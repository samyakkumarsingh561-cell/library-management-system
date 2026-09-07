import { useEffect, useRef, useState } from 'react'
import { Camera, X } from 'lucide-react'
import { Html5Qrcode } from 'html5-qrcode'

export default function QrScanner({ onScan, onClose }) {
  const scanner = useRef(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const instance = new Html5Qrcode('qr-reader')
    scanner.current = instance
    instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, (decoded) => {
      onScan(decoded)
      instance.stop().catch(() => {})
    }, () => {}).catch(() => setError('Camera access is unavailable. Check browser permissions.'))
    return () => { if (instance.isScanning) instance.stop().catch(() => {}) }
  }, [onScan])
  return <div className="scanner-overlay"><div className="scanner-modal"><div className="modal-head"><div><span className="eyebrow"><Camera size={14} /> Live scanner</span><h2>Scan a book QR</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></div><div id="qr-reader" /><p className="scanner-help">Center the book code inside the frame.</p>{error && <p className="error-text">{error}</p>}</div></div>
}
