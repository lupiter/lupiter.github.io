
export class Palette {
  constructor(palette, onColourChanged, onColourSwapped) {
    this.onColourChanged = onColourChanged;
    this.onColourSwapped = onColourSwapped;
    this.palette = document.getElementById("colour-palette");
    this.template = document.getElementById("colour-palette-colour");
    this.colours = new Set(palette);
    this.colour = "";
  }

  colourChanged(e) {
    const input = e.target;
    if (input.checked) {
      this.colour = input.value;
      this.onColourChanged(this.colour);
    }
  }

  changeColour(newColour) {
    this.colours.add(newColour);
    this.colour = newColour;
    this.renderColours();
  }

  renderColours() {
    const chips = Array.from(this.palette.getElementsByClassName("colour-palette-chip"));
    const matched = [];
    Array.from(this.colours).sort().forEach(colour => {
      let chip = chips.find(e => e.textContent === colour);
      if (chip) {
        matched.push(chip);
      } else {
        const template = this.template.content.cloneNode(true);
        const label = template.querySelector("label");
        label.setAttribute('for', colour);
        const inner = template.querySelector("span")
        inner.textContent = colour;
        inner.style.background = colour;
        const input = template.querySelector("input");
        input.onchange = this.colourChanged.bind(this);
        input.value = colour;
        input.id = colour;
        label.oncontextmenu = (e) => this.swap(e, colour);
        let timer;
        label.ontouchstart = () => {
          timer = window.setTimeout(() => {
            timer = null;
            this.swap(colour);
          }, 500);
        };
        label.ontouchmove = () => window.clearTimeout(timer);
        label.ontouchend = () => window.clearTimeout(timer);
        this.palette.appendChild(template);
      }
    });
    document.getElementById(this.colour).checked = true;
    chips.forEach(chip => {
      if (!matched.includes(chip)) {
        chip.remove();
      }
    })
  }

  swap(e, colour) {
    e.preventDefault();
    const input = document.createElement("input");
    input.setAttribute("type", "color");
    input.value = colour;
    const self = this;
    input.onchange = () => {
      self.onColourSwapped(colour, input.value);
      self.colours.delete(colour);
      self.changeColour(input.value);
    }
    input.click();
  }
}