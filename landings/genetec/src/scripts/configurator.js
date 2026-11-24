const requirement = document.querySelector('#lead-form textarea[name="problemDescription"]');
let previousSelection = '';
for (const link of document.querySelectorAll('.interest-link')) {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    let details = requirement.value;
    if (previousSelection && (details === previousSelection || details.startsWith(previousSelection + '\n'))) {
      details = details.slice(previousSelection.length).replace(/^\n/, '');
    }
    const selection = 'Me interesa cotizar ' + link.dataset.solution + '.';
    const message = details ? selection + '\n' + details : selection;
    if (message.length <= requirement.maxLength) {
      requirement.value = message;
      previousSelection = selection;
      requirement.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
      document.querySelector('#form-status').textContent = 'Acorte el requerimiento para agregar la solución seleccionada.';
    }
    document.getElementById('cotizar').scrollIntoView({block:'start'});
    requirement.focus({preventScroll:true});
  });
}

const designer = document.querySelector('#disenar');
const mode = designer.querySelector('#design-mode');
const term = designer.querySelector('#design-term');
const quantities = [...designer.querySelectorAll('[data-design]')];
const summary = designer.querySelector('#design-summary');
let previousDesign = '';
function updateDesign() {
  const cloud = mode.value === 'saas';
  designer.querySelector('#design-mode-note').textContent = cloud
    ? 'Security Center SaaS se contrata por suscripción anual por conexión, por ejemplo una cámara o un lector. El diseño puede combinar equipos locales y servicios en la nube. La disponibilidad de cada función depende del plan y los dispositivos compatibles.'
    : 'En sitio, la propuesta parte de Security Center e incorpora las conexiones y módulos necesarios. La edición y la infraestructura se dimensionan para su proyecto.';
  designer.querySelector('#term-label').textContent = cloud ? 'Horizonte de suscripción para presupuestar' : 'Cobertura de soporte deseada';
  designer.querySelector('#term-note').textContent = cloud ? 'El horizonte sirve para estimar el proyecto. La propuesta detallará el plan, el soporte incluido y la retención de video requerida.' : 'Indique el plazo que desea cotizar para Genetec Advantage. La licencia de la plataforma y la cobertura de soporte se especifican por separado. IAMET confirmará los plazos disponibles para las referencias seleccionadas.';
  const parts = [cloud ? 'Security Center SaaS' : 'Security Center local'];
  if (term.value) parts.push((cloud ? 'Horizonte: ' : 'Soporte solicitado: ') + term.value);
  for (const input of quantities) {
    if (input.validity.valid && input.valueAsNumber > 0) parts.push(input.dataset.design + ' · ' + input.dataset.unit + ': ' + input.valueAsNumber);
  }
  summary.textContent = parts.join(' | ');
}
designer.addEventListener('input', updateDesign);
updateDesign();
designer.querySelector('.design-cta').addEventListener('click', () => {
  for (const input of quantities) if (!input.reportValidity()) return;
  const field = document.querySelector('[name="problemDescription"]');
  let details = field.value;
  if (previousDesign && (details === previousDesign || details.startsWith(previousDesign + '\n'))) details = details.slice(previousDesign.length).replace(/^\n/, '');
  const prefix = 'Solicito cotización: ' + summary.textContent + '.';
  const value = details ? prefix + '\n' + details : prefix;
  if (value.length > field.maxLength) {summary.textContent += ' · Acorte el requerimiento del formulario antes de agregar la configuración.'; return;}
  field.value = value;
  previousDesign = prefix;
  field.dispatchEvent(new Event('input', {bubbles:true}));
  document.querySelector('#cotizar').scrollIntoView();
  field.focus({preventScroll:true});
});

const wallSection = document.querySelector('#videowall');
const wallButtons = [...wallSection.querySelectorAll('[data-wall]')];
const wallAdvice = wallSection.querySelector('.wall-advice');
function suggestWall() {
  const modules = [...document.querySelectorAll('[data-design]')].filter(input => input.validity.valid && input.valueAsNumber > 0);
  const count = modules.length;
  const index = count === 0 ? -1 : count === 1 ? 0 : count <= 3 ? 1 : count <= 5 ? 2 : 3;
  wallButtons.forEach((button,i) => button.closest('article').classList.toggle('suggested',i === index));
  wallAdvice.textContent = count ? 'Sugerencia inicial: ' + wallButtons[index].dataset.wall + '. Funciones consideradas: ' + modules.map(input => input.dataset.design).join(', ') + '. Puede elegir otra distribución.' : 'Seleccione sus soluciones en el configurador para ver una sugerencia.';
}
document.querySelector('#disenar').addEventListener('input', suggestWall);
suggestWall();
for (const button of wallButtons) button.addEventListener('click', () => {
  const field = document.querySelector('[name="problemDescription"]');
  const design = document.querySelector('#design-summary').textContent;
  const line = 'Videowall solicitado: ' + button.dataset.wall + '.';
  const remaining = field.value.split('\n').filter(text => !/^Videowall solicitado: [23]×[123]\.$/.test(text) && !text.startsWith('Configuración del videowall: ')).join('\n');
  const value = [remaining, line, 'Configuración del videowall: ' + design].filter(Boolean).join('\n');
  if (value.length <= field.maxLength) {
    field.value = value;
    field.dispatchEvent(new Event('input',{bubbles:true}));
  } else {document.querySelector('#form-status').textContent = 'Acorte el requerimiento para agregar el videowall.';}
  document.querySelector('#cotizar').scrollIntoView();
  field.focus({preventScroll:true});
});
