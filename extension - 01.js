const vscode = require('vscode');
const path = require('path');

function activate(context) {
    let previewUri = vscode.Uri.parse('HTMLPreview://authority/CIIC');
    let htmlShowPreview = vscode.commands.registerCommand('html.showPreview', () => {
        let editor = vscode.window.activeTextEditor,
            selectionText = editor.document.getText();

        function previewManager() {
            function htmlDocumentContentProvider() {
                fixLinks(selectionText);
            }
            
            var subscriptions = [];
            vscode.window.onDidChangeTextEditorSelection(this.onEvent, previewManager, subscriptions);
            var disposable = vscode.Disposable.from(...subscriptions);
        }

        previewManager.prototype = {
            dispose: function () {
                this.disposable.dispose();
            },
            onEvent: function () {
                this.htmlDocumentContentProvider.update(previewUri);
            }
        }

        // let provider = {
        //     provideTextDocumentContent: function () {
        //         return fixLinks(selectionText);
        //     },
        //     onEvent: function () {
        //         console.log(1111);
        //         let changer = new vscode.EventEmitter();
        //         changer.fire(previewUri);
        //     }
        // };
        
        //更改内容触发事件
        //vscode.window.onDidChangeTextEditorSelection(provider.onEvent, provider, context.subscriptions);
        //注册一个内容提供器
        //vscode.workspace.registerTextDocumentContentProvider('HTMLPreview', previewManager.htmlDocumentContentProvider);
        //预览HTML代码
        vscode.commands.executeCommand('vscode.previewHtml', previewUri, vscode.ViewColumn.Two);
    });

    context.subscriptions.push(htmlShowPreview);
}
exports.activate = activate;

function fixLinks(html) {
    let documentFileName = vscode.window.activeTextEditor.document.fileName;
    return html.replace(new RegExp("((?:src|href)=[\'\"])((?!http|\\/).*?)([\'\"])", "gmi"), function (subString, p1, p2, p3) {
        return [
            p1,
            vscode.Uri.file(path.join(path.dirname(documentFileName), p2)),
            p3
        ].join("");
    });
}

function deactivate() {
}

exports.deactivate = deactivate;