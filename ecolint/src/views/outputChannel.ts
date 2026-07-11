import { window, OutputChannel } from 'vscode';

let outputChannel: OutputChannel | undefined;

export function registerOutputChannel(): OutputChannel {
  if (!outputChannel) {
    outputChannel = window.createOutputChannel('EcoLint');
  }
  return outputChannel;
}

export function getOutputChannel(): OutputChannel | undefined {
  return outputChannel;
}