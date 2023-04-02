import { Document, Title, Tools, Palette } from "./dotty-ui-tools.js";
import { Canvas, History } from "./dotty-canvas.js";
import { Menus, ResizeDialog, NewDialog, AboutDialog, ExportDialog, DownloadMenu, OpenDialog, ImportPaletteDialog, MoveControls } from "./dotty-menus-dialogs.js";

const menus = new Menus();

const title = new Title();
const document = new Document();
const tools = new Tools();
const palette = new Palette();
const history = new History();
const canvas = new Canvas(document, tools, palette, history);
history.canvas = canvas;

const aboutDialog = new AboutDialog(title);
const downloadMenu = new DownloadMenu(canvas, document);
const resizeDialog = new ResizeDialog(title, canvas, history, document);
const newDialog = new NewDialog(title, canvas, history, document);
const exportDialog = new ExportDialog(title, canvas, history, document);
const importPaletteDialog = new ImportPaletteDialog(title, canvas, history, document, palette);
const moveControls = new MoveControls(title, canvas, history, document, tools);
const openDialog = new OpenDialog(title, canvas, history, document);

canvas.load();