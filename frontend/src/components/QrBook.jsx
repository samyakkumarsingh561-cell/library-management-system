import { Download, QrCode } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'

export default function QrBook({ book }) {
  const download = () => {
    const canvas = document.getElementById(`qr-${book.id}`)
    const link = document.createElement('a')
    link.download = `${book.isbn}-qr.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  return <div className="qr-wrap">
    <QRCodeCanvas id={`qr-${book.id}`} value={book.isbn} size={116} bgColor="#ffffff" fgColor="#102a43" includeMargin />
    <div><strong>{book.isbn}</strong><span>Scan to identify</span><button className="text-button" onClick={download}><Download size={13} /> Download</button></div>
  </div>
}
