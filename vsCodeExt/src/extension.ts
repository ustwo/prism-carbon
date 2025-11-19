import * as vscode from 'vscode';
import { InterceptorProxy } from './proxyServer';


let proxyServer: InterceptorProxy;
const PROXY_PORT = 3024;

export function activate(context: vscode.ExtensionContext) {
	console.log('Interceptor Proxy Server is active');

	let startDisposable = vscode.commands.registerCommand('interceptor.start', async () => {
		try {
			// start local server
			proxyServer = new InterceptorProxy(PROXY_PORT);
			await proxyServer.start(context.globalStorageUri.fsPath);

			// set VSCode to use local proxy
			const config = vscode.workspace.getConfiguration('http');
			await config.update('proxy', `http://localhost:${PROXY_PORT}`, vscode.ConfigurationTarget.Global)

			//QUICK FIX TO NOT NEED SSL CERTS FOR NOW
			await config.update('proxyStrictSSL', false, vscode.ConfigurationTarget.Global);

			vscode.window.showInformationMessage('Interceptor Proxy started on port ' + PROXY_PORT);
		} catch (error) {
			vscode.window.showErrorMessage('Failed to start Interceptor Proxy: ' + error);
		}
	});

	let stopDisposable = vscode.commands.registerCommand('interceptor.stop', async () => {
		// stop local server
		if (proxyServer) {
			proxyServer.stop();
		}

		// clear VSCode proxy settings
		const config = vscode.workspace.getConfiguration('http');
		await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
		await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);

		vscode.window.showInformationMessage('Interceptor Proxy stopped. Proxy settings cleared.');
	});

	let terminalDisposable = vscode.commands.registerCommand('interceptor.openTerminal', async () => {
		if (!proxyServer) {
			vscode.window.showErrorMessage("There is no Interceptor Proxy Running. Please initiate `interceptor.start`");
			return;
		}

		const proxyUrl = `http://127.0.0.1:${PROXY_PORT}`;

		//create a new terminal with specific Environment Vars

		const terminal = vscode.window.createTerminal({
			name: "Estimating Carbon Terminal",
			env: {
				//Standard Proxy Vars
				"HTTP_PROXY": proxyUrl,
				"HTTPS_PROXY": proxyUrl,
				"http_proxy": proxyUrl,
				"https_proxy": proxyUrl,

				// python specific
				"REQUESTS_CA_BUNDLE": proxyServer.certPath,

				// NODE JS SPECIFIC: Trust the proxy
				"NODE_EXTRA_CA_CERTS": proxyServer.certPath
			}
		});

		terminal.show()
		vscode.window.showInformationMessage("Opened Terminal with Proxy Environment Vars");
	});

	context.subscriptions.push(terminalDisposable)
	context.subscriptions.push(startDisposable);
	context.subscriptions.push(stopDisposable);
}


export async function deactivate() {
	// Make sure that the vscode isn't always vulnerable
	if (proxyServer) {
		await proxyServer.stop();
	}
	const config = vscode.workspace.getConfiguration('http');
	await config.update('proxy', undefined, vscode.ConfigurationTarget.Global);
	await config.update('proxyStrictSSL', undefined, vscode.ConfigurationTarget.Global);
}
