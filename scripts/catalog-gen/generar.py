"""Genera src/catalog.js de CostIQ: 150 actividades del día a día (10 áreas × 15).
Las 10 primeras de cada área son literalmente las del catálogo de la Sesión 1 del
Módulo 2; las 5 restantes son nuevas, con el mismo estilo (verbo + resultado verificable).

Cada actividad lleva una frecuencia REAL (veces al mes) — nunca "diaria" por defecto —,
minutos de referencia por ejecución y una reducción estimada con IA. Los minutos son de
referencia: la app los marca «por confirmar» hasta que el usuario pone los suyos."""
import json, re
from pathlib import Path

HERE = Path(__file__).parent
S1 = json.load(open(HERE / 'catalogo_dia_s1.json', encoding='utf-8'))

NEW = {
 'Dirección y gerencia': [
  ('Preparar el resumen de indicadores para la reunión de gerencia', 'Una página con los indicadores de la semana y lo que se movió.', 'Semanal'),
  ('Redactar el mensaje de reconocimiento a un equipo', 'Un mensaje breve que nombra el logro y a quienes lo hicieron.', 'Varias veces al mes'),
  ('Ordenar la bandeja de correo y responder lo urgente', 'Bandeja priorizada y respuestas breves a lo que no puede esperar.', 'Diaria'),
  ('Preparar el informe mensual para el directorio', 'El informe con resultados, desvíos y decisiones pendientes.', 'Mensual'),
  ('Redactar la minuta de una reunión con un cliente clave', 'Acuerdos, responsables y fechas de la reunión.', 'Varias veces al mes'),
 ],
 'Comercial y ventas': [
  ('Actualizar la ficha del cliente después de una visita', 'La ficha del CRM al día con lo conversado y el siguiente paso.', 'Varias veces por semana'),
  ('Preparar la presentación para una reunión con cliente', 'Las láminas adaptadas al cliente y a su problema.', 'Semanal'),
  ('Redactar el correo de bienvenida a un cliente nuevo', 'Un correo con contactos, próximos pasos y qué esperar.', 'Varias veces al mes'),
  ('Resumir las ventas del mes por vendedor', 'Una tabla con resultado contra meta y una nota por vendedor.', 'Mensual'),
  ('Preparar el informe de visita a un cliente', 'El informe de la visita con hallazgos y compromisos.', 'Varias veces por semana'),
 ],
 'Marketing y contenido': [
  ('Redactar las publicaciones de redes de la semana', 'Los textos de la semana listos para programar.', 'Semanal'),
  ('Responder los comentarios y mensajes de redes', 'Respuestas en el tono de la marca a lo recibido en el día.', 'Diaria'),
  ('Redactar la nota de prensa de un lanzamiento', 'La nota con titular, datos y cita lista para enviar.', 'Trimestral'),
  ('Preparar el informe de métricas de redes', 'Las cifras del mes con una lectura de qué funcionó.', 'Mensual'),
  ('Redactar el texto de la página de un producto o servicio', 'El texto de la página con beneficios y llamada a la acción.', 'Varias veces al mes'),
 ],
 'Servicio al cliente': [
  ('Responder correos de consultas frecuentes', 'Respuestas correctas a las consultas repetidas del día.', 'Diaria'),
  ('Redactar la encuesta de satisfacción posterior a la atención', 'Las preguntas de la encuesta, cortas y sin sesgo.', 'Trimestral'),
  ('Resumir las encuestas de satisfacción del mes', 'Los resultados del mes con los tres temas que más se repiten.', 'Mensual'),
  ('Preparar el traspaso de casos al siguiente turno', 'La lista de casos abiertos con su estado y lo que falta.', 'Diaria'),
  ('Redactar la respuesta a una reseña pública', 'Una respuesta pública, cordial y concreta.', 'Varias veces por semana'),
 ],
 'Finanzas y control de gestión': [
  ('Preparar el reporte de cuentas por cobrar por antigüedad', 'El reporte por tramo de antigüedad con los casos a gestionar.', 'Semanal'),
  ('Responder consultas de proveedores sobre pagos', 'Respuestas con el estado de cada factura consultada.', 'Diaria'),
  ('Revisar y clasificar los gastos de la tarjeta corporativa', 'Los gastos clasificados y los que requieren respaldo.', 'Mensual'),
  ('Preparar la conciliación bancaria del mes', 'La conciliación con las partidas pendientes explicadas.', 'Mensual'),
  ('Redactar la explicación de desvíos frente al presupuesto', 'Un texto breve que explica cada desvío relevante.', 'Mensual'),
 ],
 'Talento humano': [
  ('Coordinar y confirmar las entrevistas de la semana', 'La agenda de entrevistas confirmada con cada candidato.', 'Semanal'),
  ('Responder consultas del personal sobre vacaciones y permisos', 'Respuestas según la política vigente.', 'Diaria'),
  ('Preparar el reporte mensual de ausentismo', 'El reporte por área con los casos que requieren atención.', 'Mensual'),
  ('Redactar el anuncio de una vacante para publicar', 'El aviso listo para publicar en los portales.', 'Varias veces al mes'),
  ('Redactar la respuesta a candidatos no seleccionados', 'Un mensaje respetuoso y personalizado para cada candidato.', 'Varias veces al mes'),
 ],
 'Legal y cumplimiento': [
  ('Redactar un acuerdo de confidencialidad estándar', 'El acuerdo con los datos de las partes, listo para revisión.', 'Varias veces al mes'),
  ('Preparar el calendario de vencimientos y obligaciones', 'El calendario del mes con responsables por obligación.', 'Mensual'),
  ('Responder consultas legales internas frecuentes', 'Respuestas basadas en la política o el contrato aplicable.', 'Diaria'),
  ('Revisar las condiciones de uso de un proveedor de software', 'Un resumen de riesgos: datos, responsabilidad y terminación.', 'Varias veces al mes'),
  ('Preparar el resumen de litigios y casos abiertos', 'El estado de cada caso con la próxima actuación.', 'Mensual'),
 ],
 'Operaciones y logística': [
  ('Preparar el reporte semanal de indicadores de operación', 'Los indicadores de la semana con las causas de los desvíos.', 'Semanal'),
  ('Redactar el correo de coordinación con el transportista', 'El correo con horarios, cantidades y contacto en sitio.', 'Diaria'),
  ('Resumir las devoluciones del mes y sus causas', 'Las devoluciones agrupadas por causa y por cliente.', 'Mensual'),
  ('Preparar el informe de cierre del turno', 'Lo producido, lo pendiente y las novedades del turno.', 'Diaria'),
  ('Actualizar el registro de mantenimiento de equipos', 'El registro al día con lo realizado y lo próximo.', 'Semanal'),
 ],
 'Compras y proveedores': [
  ('Preparar la evaluación anual de proveedores', 'La evaluación de cada proveedor con su puntaje y comentarios.', 'Anual'),
  ('Redactar la solicitud de alta de un proveedor nuevo', 'La solicitud con los datos y documentos requeridos.', 'Varias veces al mes'),
  ('Resumir las condiciones de dos ofertas para decidir', 'Una comparación de precio, plazo y condiciones.', 'Semanal'),
  ('Responder consultas internas sobre el estado de un pedido', 'El estado del pedido y la fecha esperada.', 'Diaria'),
  ('Preparar el reporte de ahorros negociados', 'Los ahorros del período respaldados por cotización.', 'Trimestral'),
 ],
 'Tecnología y sistemas': [
  ('Redactar las notas de una nueva versión del sistema', 'Qué cambió y qué debe hacer distinto el usuario.', 'Mensual'),
  ('Preparar el reporte semanal de tickets atendidos', 'Los tickets de la semana por tipo y tiempo de resolución.', 'Semanal'),
  ('Responder consultas de acceso y contraseñas', 'La respuesta con los pasos según el procedimiento.', 'Diaria'),
  ('Revisar y resumir las alertas de seguridad', 'Las alertas de la semana con las que requieren acción.', 'Semanal'),
  ('Redactar el plan de pruebas de un cambio', 'Los casos de prueba con el resultado esperado.', 'Varias veces al mes'),
 ],
}

# Frecuencia → veces al mes. 'daily' se resuelve en la app con los días laborales configurados.
FREQ = {
 'Diaria': 'daily', 'Varias veces por semana': 12, 'Semanal': 4, 'Después de cada reunión': 4,
 'Varias veces al mes': 6, 'Mensual': 1, 'Trimestral': 1/3, 'Semestral': 1/6,
 'Anual y en cada revisión': 1/6, 'Anual': 1/12,
}

# Minutos, reducción y categoría por verbo inicial (referencia), con excepciones explícitas.
VERB = [
 (r'^(Redactar|Responder) (el|la|un|una)? ?(correo|carta|respuesta|disculpa|comunicado|mensaje)|^Responder', (20, 60, 'Comunicación interna')),
 (r'^Resumir', (40, 60, 'Búsqueda de información')),
 (r'^Redactar', (60, 55, 'Reportes y documentación')),
 (r'^Preparar (el|la) (reporte|informe|comentario|presentación|flujo|conciliación)', (90, 50, 'Reportes y documentación')),
 (r'^Preparar', (45, 50, 'Coordinación y seguimiento')),
 (r'^(Convertir|Documentar|Despiezar)', (60, 55, 'Reportes y documentación')),
 (r'^(Comparar|Revisar)', (40, 45, 'Revisiones y aprobaciones')),
 (r'^(Clasificar|Actualizar|Conciliar|Armar|Consolidar)', (45, 50, 'Entrada de datos manual')),
 (r'^(Traducir)', (40, 70, 'Reportes y documentación')),
 (r'^(Investigar|Detectar)', (40, 55, 'Búsqueda de información')),
 (r'^(Adaptar|Generar)', (30, 65, 'Reportes y documentación')),
 (r'^(Coordinar|Ordenar)', (40, 45, 'Coordinación y seguimiento')),
]
OVR = {  # minutos por ejecución donde el verbo no basta
 'Preparar el comentario del reporte mensual': 120, 'Preparar la presentación de cifras del mes': 120,
 'Preparar la respuesta a preguntas del auditor': 180, 'Resumir las hojas de vida recibidas': 60,
 'Preparar el plan de inducción de alguien que entra': 90, 'Preparar el material de una capacitación interna': 180,
 'Resumir las evaluaciones de desempeño de un equipo': 120, 'Preparar la lista de verificación de una auditoría': 90,
 'Consolidar los reportes de las sucursales': 120, 'Resumir el desempeño de entregas del trimestre': 90,
 'Redactar las condiciones estándar de compra': 180, 'Convertir el presupuesto en un resumen para el área': 90,
 'Redactar el boletín mensual': 120, 'Preparar el calendario de contenidos del mes': 90, 'Despiezar un webinar en piezas cortas': 90,
 'Preparar el reporte de resultados de campaña': 120, 'Resumir los resultados de una encuesta interna': 120,
 'Preparar el guion de una presentación': 90, 'Preparar la propuesta comercial estándar': 90,
 'Redactar respuestas a objeciones frecuentes': 90, 'Redactar las respuestas tipo del canal de chat': 120,
 'Redactar respuestas a consultas frecuentes del personal': 120, 'Preparar el expediente de un caso': 90,
 'Preparar el inventario de licencias y accesos': 90, 'Preparar el informe mensual para el directorio': 180,
 'Ordenar la bandeja de correo y responder lo urgente': 60, 'Preparar la evaluación anual de proveedores': 240,
 'Preparar la conciliación bancaria del mes': 120, 'Resumir las ventas del mes por vendedor': 60,
 'Redactar la descripción de un puesto': 45, 'Redactar la carta de oferta y sus anexos': 30,
 'Redactar un acuerdo de confidencialidad estándar': 30, 'Redactar una cláusula estándar': 30,
 'Resumir un contrato en sus puntos clave': 45, 'Clasificar y etiquetar los tickets del día': 30,
 'Armar el flujo de caja semanal': 60, 'Conciliar y explicar diferencias en una planilla': 60,
 'Preparar el reporte diario de entregas': 30, 'Preparar el informe de cierre del turno': 20,
 'Preparar el traspaso de casos al siguiente turno': 20, 'Redactar el procedimiento de una tarea': 90,
 'Redactar las publicaciones de redes de la semana': 90, 'Redactar la nota de prensa de un lanzamiento': 90,
 'Redactar el plan de pruebas de un cambio': 90, 'Redactar las notas de una nueva versión del sistema': 60,
}

def ref(name):
    for pat, (m, r, c) in VERB:
        if re.search(pat, name):
            return OVR.get(name, m), r, c
    return OVR.get(name, 45), 50, 'Otra'

areas, seen = [], set()
order = list(dict.fromkeys(a['area'] for a in S1))
for ai, area in enumerate(order, 1):
    base = [a for a in S1 if a['area'] == area]
    assert len(base) == 10, (area, len(base))
    items = [(a['name'], a['produce'], a['freq'].rstrip('.')) for a in base] + NEW[area]
    assert len(items) == 15, area
    out = []
    for k, (name, produce, freq) in enumerate(items, 1):
        assert freq in FREQ, (name, freq)
        assert name not in seen, ('duplicada', name); seen.add(name)
        m, r, c = ref(name)
        out.append({'n': f'{ai}.{k}', 'name': name, 'produce': produce, 'freq': freq,
                    'times': FREQ[freq], 'minutes': m, 'reduction': r, 'category': c, 's1': k <= 10})
    areas.append({'area': area, 'items': out})

js = ('// Generado por scripts/catalog-gen (no editar a mano): 150 actividades del día a día,\n'
      '// 10 áreas × 15. Las 10 primeras de cada área son las del catálogo de la Sesión 1 del\n'
      '// Módulo 2 (EIAL · PBS). times = veces al mes ("daily" = días laborales de Configuración).\n'
      '// minutes y reduction son de REFERENCIA: la app los marca «por confirmar».\n'
      'export const CATALOG = ' + json.dumps(areas, ensure_ascii=False, indent=1) + ';\n')
dst = HERE.parent.parent / 'src' / 'catalog.js'   # scripts/catalog-gen → raíz del repo
dst.write_text(js, encoding='utf-8', newline='\n')
from collections import Counter
print(f'{sum(len(a["items"]) for a in areas)} actividades · {len(areas)} áreas · {dst.stat().st_size} bytes')
print('frecuencias:', Counter(i['freq'] for a in areas for i in a['items']).most_common())
print('categorías:', Counter(i['category'] for a in areas for i in a['items']).most_common())
