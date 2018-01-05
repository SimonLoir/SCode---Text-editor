import Editor from "./../editor/editor";
export default class Tab {

    private _filename:string;
    private _type:string;
    private _editor:Editor;

    constructor(filename:string, type:string){
        this._filename = filename;
        this._type = type;
    }

    public codeEditor(default_content:string, container:ExtJsObject){
        //Here comes the code editor
        this._editor = new Editor(this._type, default_content, container);
    }

    public viewer(){
        //Here comes a view
    }
}