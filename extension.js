const vscode = require('vscode');
const path = require('path');

function activate(context) {
    let utilities = new Utilities(),
        previewUri = vscode.Uri.parse('HTMLPreview://authority/CIIC'),
        htmlShowPreview = vscode.commands.registerCommand('html.showPreview', () => {
            utilities.init(vscode.ViewColumn.Two, context, previewUri);
        });

    context.subscriptions.push(htmlShowPreview);
}
exports.activate = activate;

var Utilities = (function () {
    function Utilities() {
    }

    Utilities.prototype.checkDocumentIsHTML = function (showWarning) {
        let result = vscode.window.activeTextEditor.document.languageId.toLowerCase() === "html";
        if (!result && showWarning) {
            vscode.window.showInformationMessage("The current editor doesn't show a HTML document.");
        }
        return result;
    };

    Utilities.prototype.init = function (viewColumn, context, previewUri) {
        let proceed = this.checkDocumentIsHTML(true);
        if (proceed) {
            var previewManager = new PreviewManager();
            vscode.workspace.registerTextDocumentContentProvider('HTMLPreview', previewManager.htmlDocumentContentProvider);
            return vscode.commands.executeCommand('vscode.previewHtml', previewUri, viewColumn);
        }
    };

    return Utilities;
}());

var PreviewManager = (function () {
    function PreviewManager(utilities, htmlDocumentContentProvider) {
        this.utilities = utilities && utilities || new Utilities();
        this.htmlDocumentContentProvider = htmlDocumentContentProvider && htmlDocumentContentProvider || new HTMLDocumentContentProvider();
        this.htmlDocumentContentProvider.generateHTML();
        let subscriptions = [];
        vscode.window.onDidChangeTextEditorSelection(this.onEvent, this, subscriptions);
        this.disposable = vscode.Disposable.from(...subscriptions);
    }

    PreviewManager.prototype.dispose = function () {
        this.disposable.dispose();
    };

    PreviewManager.prototype.onEvent = function () {
        this.htmlDocumentContentProvider.update(vscode.Uri.parse('HTMLPreview://authority/CIIC'));
    };

    return PreviewManager;
}());

var HTMLDocumentContentProvider = (function () {
    function HTMLDocumentContentProvider() {
        this._onDidChange = new vscode.EventEmitter();
        this._textEditor = vscode.window.activeTextEditor;
    }

    HTMLDocumentContentProvider.prototype.provideTextDocumentContent = function (uri) {
        return this.generateHTML();
    };

    HTMLDocumentContentProvider.prototype.generateHTML = function () {
        let plainText = this._textEditor.document.getText();
        let html = this.fixLinks(plainText);
        let htmlWithStyle = this.addStyles(html);
        return htmlWithStyle;
    };

    HTMLDocumentContentProvider.prototype.fixLinks = function (html) {
        let documentFileName = this._textEditor.document.fileName;
        return html.replace(new RegExp("((?:src|href)=[\'\"])((?!http|\\/).*?)([\'\"])", "gmi"), function (subString, p1, p2, p3) {
            return [
                p1,
                vscode.Uri.file(path.join(path.dirname(documentFileName), p2)),
                p3
            ].join("");
        });
    };

    HTMLDocumentContentProvider.prototype.update = function (uri) {
        this._onDidChange.fire(uri);
    };

    HTMLDocumentContentProvider.prototype.addStyles = function (html) {
        let extensionPath = vscode.extensions.getExtension('Triangel.html-preview').extensionPath;
        let style_path = vscode.Uri.file(`${extensionPath}/${'resources/ciic_style.css'}`);
        let styles = `<link href="${style_path}" rel="stylesheet" />`;
        return html + styles;
    };

    Object.defineProperty(HTMLDocumentContentProvider.prototype, "onDidChange", {
        get: function () {
            return this._onDidChange.event;
        },
        enumerable: true,
        configurable: true
    });
    return HTMLDocumentContentProvider;
}());