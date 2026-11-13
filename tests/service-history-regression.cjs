// Run: node --test tests/service-history-regression.cjs
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, imports) {
  const result = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    fileName: file, reportDiagnostics: true,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  });
  assert.equal(result.diagnostics.filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const scope = { exports: {}, require(name) {
    assert.ok(Object.hasOwn(imports, name), `Unexpected import: ${name}`);
    return imports[name];
  }};
  vm.runInNewContext(result.outputText, scope);
  return scope.exports;
}
const data = load('client/src/components/v2/solutionsData.ts', {
  'lucide-react': new Proxy({}, {get: () => () => null}),
});
function page(language, location) {
  let metadata;
  const stub = () => null;
  const jsx = (type, props) => ({type, props});
  const Page = load('client/src/pages/ServiceLandingV2.tsx', {
    'react/jsx-runtime': {jsx, jsxs: jsx},
    wouter: {Link: stub, useLocation: () => [location]},
    '@/components/v2/solutionsData': data,
    '@/contexts/LanguageContext': {useLanguage: () => ({language})},
    '@/components/v2/ComputingHeroV2': {default: stub},
    '@/components/v2/ServiceHeroV2': {default: stub},
    '@/components/v2/ServiceConversionV2': {default: stub, useServiceMetadata: (name) => {metadata = name;}},
  }).default;
  return id => {const tree = Page({serviceId:id}); return {tree, metadata};};
}
const app = fs.readFileSync(path.join(root,'client/src/App.tsx'),'utf8');
const matches = [...app.matchAll(/<Route path="([^"]+)">\{\(\) => <ServiceLandingV2 serviceId="([^"]+)" \/>\}<\/Route>/g)];
test('all shared service routes pass the matching catalog ID', () => {
  assert.equal(matches.length,8);
  for (const [,route,id] of matches) assert.equal(data.solutionDestinations[id],route);
});
test('outgoing pages keep their service when history changes location', () => {
  for (const language of ['es','en']) for (const [,route,id] of matches) {
    const expected = data.solutions.find(s=>s.id===id)[language];
    // Simulate back to home/hub and forward to another service before unmount.
    for (const location of [route,'/','/soluciones','/soluciones/cctv']) {
      const result = page(language,location)(id);
      assert.equal(result.metadata,expected);
      assert.equal(result.tree.type,'div');
    }
  }
});
test('an unknown service renders a recovery link rather than throwing', () => {
  const {tree,metadata}=page('es','/')( 'missing-service');
  assert.equal(tree.type,'section');
  assert.equal(metadata,'Solución no encontrada');
  assert.equal(tree.props.children[1].props.href,'/soluciones');
});
