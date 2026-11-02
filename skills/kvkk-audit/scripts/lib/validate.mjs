// Dependency-free validator for kvkk-audit report JSON.
// Applies the keyword subset used by ../../schema/report.schema.json:
// type, enum, const, required, properties, additionalProperties:false,
// items, $ref (#/$defs/...), minLength, minimum, pattern.
import { readFileSync } from 'node:fs';

const schema = JSON.parse(
  readFileSync(new URL('../../schema/report.schema.json', import.meta.url), 'utf8'),
);

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v;
}

function matchesType(v, t) {
  if (t === 'integer') return typeof v === 'number' && Number.isInteger(v);
  if (t === 'number') return typeof v === 'number' && Number.isFinite(v);
  return typeOf(v) === t;
}

function resolveRef(ref) {
  if (!ref.startsWith('#/')) throw new Error(`Unsupported $ref: ${ref}`);
  return ref.slice(2).split('/').reduce((node, key) => node[key], schema);
}

const join = (path, key) => (path ? `${path}.${key}` : key);
const label = (path) => path || '(root)';

function check(value, node, path, errors) {
  if (node.$ref) node = resolveRef(node.$ref);

  if ('const' in node && value !== node.const) {
    errors.push(`${label(path)}: must be ${JSON.stringify(node.const)}`);
    return;
  }
  if (node.enum && !node.enum.includes(value)) {
    errors.push(`${label(path)}: must be one of ${node.enum.map((e) => JSON.stringify(e)).join(', ')}`);
    return;
  }
  if (node.type && !matchesType(value, node.type)) {
    errors.push(`${label(path)}: must be ${node.type}`);
    return;
  }

  if (typeof value === 'string') {
    if (node.minLength !== undefined && value.length < node.minLength) {
      errors.push(`${label(path)}: must have at least ${node.minLength} character(s)`);
    }
    if (node.pattern && !new RegExp(node.pattern).test(value)) {
      errors.push(`${label(path)}: must match pattern ${node.pattern}`);
    }
  }
  if (typeof value === 'number' && node.minimum !== undefined && value < node.minimum) {
    errors.push(`${label(path)}: must be >= ${node.minimum}`);
  }

  if (node.type === 'array') {
    if (node.items) value.forEach((item, i) => check(item, node.items, `${path}[${i}]`, errors));
  } else if (node.type === 'object') {
    const props = node.properties || {};
    for (const key of node.required || []) {
      if (!Object.prototype.hasOwnProperty.call(value, key)) {
        errors.push(`${join(path, key)}: required property is missing`);
      }
    }
    for (const key of Object.keys(value)) {
      if (props[key]) check(value[key], props[key], join(path, key), errors);
      else if (node.additionalProperties === false) {
        errors.push(`${join(path, key)}: unexpected property`);
      }
    }
  }
}

/**
 * @param {unknown} report
 * @returns {string[]} empty when valid; each error is "<json-path>: <message>"
 */
export function validateReport(report) {
  const errors = [];
  check(report, schema, '', errors);
  return errors;
}
