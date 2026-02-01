import * as assert from 'assert';
import { after } from 'mocha';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('start tests');
  after(() => {
    vscode.window.showInformationMessage('end tests');
  });

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
  });
  test('Sample2 test',() => {
    assert.strictEqual(1,2);
  });
});