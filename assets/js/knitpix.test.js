// This isn't a proper test framework, okay? I just need a way to do this without a browser.

import * as knitpix from "./knitpix";

const swatch = knitpix.Swatch(() => console.log("save!"))

swatch.resize(24, 20);

