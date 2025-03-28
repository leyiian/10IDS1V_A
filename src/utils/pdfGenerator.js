import jsPDF from 'jspdf'

export function generateFacturaPDF(factura, formatters) {
  const doc = new jsPDF()

  // Actualizar espaciados para acomodar todas las secciones
  const styles = {
    title: { fontSize: 22, color: 40, y: 20 },
    header: { fontSize: 12, y: 50 },
    facturaInfo: { fontSize: 14, y: 80 },
    clienteInfo: { fontSize: 12, y: 105 },
    servicioInfo: { fontSize: 12, y: 165 },
    polizaInfo: { fontSize: 12, y: 215 },
    montoInfo: { fontSize: 16, y: 260 },
    footer: { fontSize: 10, y: 280 },
    colors: {
      darkBlue: [41, 128, 185],
      lightBlue: [52, 152, 219],
      veryLightBlue: [214, 234, 248]
    }
  }

  // Fondo del encabezado
  doc.setFillColor(...styles.colors.darkBlue)
  doc.rect(0, 0, 210, 40, 'F')

  // Título con color blanco
  doc.setFontSize(styles.title.fontSize)
  doc.setTextColor(255, 255, 255)
  doc.text('FACTURA', 105, styles.title.y, { align: 'center' })

  // Línea decorativa (ajustada más arriba)
  doc.setDrawColor(...styles.colors.lightBlue)
  doc.setLineWidth(0.5)
  doc.line(20, 35, 190, 35) // Ajustada de 45 a 35

  // Datos de la empresa (manteniendo la posición ajustada en styles)
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(styles.header.fontSize)
  doc.text([
    'LaExitosa S.A. DE C.V.',
    'RFC: PUES34224',
    'Dirección: JajajjaSimon #123'
  ], 20, styles.header.y)

  // Sección de información de factura
  doc.setFillColor(...styles.colors.veryLightBlue)
  doc.roundedRect(15, 70, 180, 25, 3, 3, 'F')

  doc.setFontSize(styles.facturaInfo.fontSize)
  doc.setTextColor(...styles.colors.darkBlue)
  doc.text('DATOS DE FACTURA', 20, styles.facturaInfo.y - 10)

  doc.setTextColor(0, 0, 0)
  doc.text([
    `Factura #: ${factura.id}`,
    `Fecha: ${formatters.formatDate(factura.fecha)}`,
    `Observaciones: ${factura.observaciones || 'N/A'}`
  ], 30, styles.facturaInfo.y)

  // Sección de cliente
  doc.setFillColor(...styles.colors.veryLightBlue)
  doc.roundedRect(15, 100, 180, 50, 3, 3, 'F')

  doc.setTextColor(...styles.colors.darkBlue)
  doc.setFontSize(14)
  doc.text('INFORMACIÓN DEL CLIENTE', 20, styles.clienteInfo.y)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(styles.clienteInfo.fontSize)
  doc.text([
    `Nombre: ${factura.cliente?.nombre || 'N/A'}`,
    `RFC: ${factura.cliente?.rfc || 'N/A'}`,
    `Email: ${factura.cliente?.email || 'N/A'}`
  ], 30, styles.clienteInfo.y + 15)

  // Sección de servicio
  doc.setFillColor(...styles.colors.veryLightBlue)
  doc.roundedRect(15, 155, 180, 45, 3, 3, 'F')

  doc.setTextColor(...styles.colors.darkBlue)
  doc.setFontSize(14)
  doc.text('DETALLES DEL SERVICIO', 20, styles.servicioInfo.y - 10)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(styles.servicioInfo.fontSize)
  doc.text([
    `Servicio #: ${factura.servicio?.id || 'N/A'}`,
    `Fecha del Servicio: ${formatters.formatDate(factura.servicio?.fecha) || 'N/A'}`,
    `Observaciones: ${factura.servicio?.observaciones || 'N/A'}`
  ], 30, styles.servicioInfo.y)

  // Sección de póliza
  if (factura.servicios?.poliza) {
    doc.setFillColor(...styles.colors.veryLightBlue)
    doc.roundedRect(15, 205, 180, 40, 3, 3, 'F')

    doc.setTextColor(...styles.colors.darkBlue)
    doc.setFontSize(14)
    doc.text('DETALLES DE PÓLIZA', 20, styles.polizaInfo.y - 10)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(styles.polizaInfo.fontSize)
    doc.text([
      `Póliza #: ${factura.servicios.poliza.id}`,
      `Total Horas: ${factura.servicios.poliza.total_horas}`,
      `Precio: ${formatters.formatPrice(factura.servicios.poliza.precio)}`
    ], 30, styles.polizaInfo.y)
  }

  // Sección de monto total
  doc.setFillColor(...styles.colors.darkBlue)
  doc.roundedRect(15, styles.montoInfo.y - 15, 180, 25, 3, 3, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(styles.montoInfo.fontSize)
  doc.text('Monto Total:', 20, styles.montoInfo.y)
  doc.text(` ${formatters.formatPrice(factura.monto)}`, 100, styles.montoInfo.y)

  // Observaciones con marco
  if (factura.observaciones) {
    doc.setFillColor(...styles.colors.veryLightBlue)
    doc.roundedRect(15, 195, 180, 40, 3, 3, 'F')

    doc.setTextColor(...styles.colors.darkBlue)
    doc.setFontSize(14)
    doc.text('OBSERVACIONES', 20, 205)

    doc.setTextColor(0, 0, 0)
    doc.setFontSize(10)
    const splitObservaciones = doc.splitTextToSize(factura.observaciones, 150)
    doc.text(splitObservaciones, 30, 215)
  }

  // Pie de página con línea decorativa
  doc.setDrawColor(...styles.colors.lightBlue)
  doc.setLineWidth(0.5)
  doc.line(20, styles.footer.y - 10, 190, styles.footer.y - 10)

  doc.setTextColor(0, 0, 0)
  doc.setFontSize(styles.footer.fontSize)
  doc.text('Este documento es una representación impresa de un CFDI', 105, styles.footer.y, { align: 'center' })

  return doc
}
