import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crearCSV } from '../src/csv.js';

test('CSV conserva acentos, delimitadores y comillas', () => {
  assert.equal(crearCSV(['Artículo', 'Stock'], [['Taladro; "QA"', '2.50']]), '\uFEFF"Artículo";"Stock"\r\n"Taladro; ""QA""";"2.50"');
});

test('CSV trata formulas como texto y tolera campos nulos', () => {
  const csv = crearCSV(['Nombre'], [['=1+1'], [' @SUM(A1)'], [null]]);
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"\' @SUM(A1)"'));
  assert.ok(csv.endsWith('""'));
});
