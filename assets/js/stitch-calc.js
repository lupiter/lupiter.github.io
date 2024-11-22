
class Tension {
    constructor(prefix) {
        this.stitchInput = document.getElementById(prefix + "-stitches");
        this.rowInput = document.getElementById(prefix + "-rows");
    }

    fillIn(otherTension, thisMeasurements, otherMeasurements) {
        if (thisMeasurements.lengthInput.value && otherMeasurements.lengthInput.value) {
            const conversion = otherMeasurements.lengthInput.value / thisMeasurements.lengthInput.value;
            if (!this.rowInput.value && otherTension.rowInput.value) {
                this.rowInput.value = conversion * otherTension.rowInput.value;
            }
        }
        let conversion;
        if (thisMeasurements.chestInput.value && otherMeasurements.chestInput.value) {
            conversion = otherMeasurements.chestInput.value / thisMeasurements.chestInput.value;
        } else if (thisMeasurements.waistInput.value && otherMeasurements.waistInput.value) {
            conversion = otherMeasurements.waistInput.value / thisMeasurements.waistInput.value;
        } else if (thisMeasurements.hipsInput.value && otherMeasurements.hipsInput.value) {
            conversion = otherMeasurements.hipsInput.value / thisMeasurements.hipsInput.value;
        }
        if (conversion && !this.stitchInput.value && otherTension.stitchInput.value) {
            this.stitchInput.value = conversion * otherTension.stitchInput.value;
        }
    }
}

class Measurements {
    constructor(prefix) {
        this.chestInput = document.getElementById(prefix + "-chest");
        this.lengthInput = document.getElementById(prefix + "-length");
        this.waistInput = document.getElementById(prefix + "-waist");
        this.hipsInput = document.getElementById(prefix + "-hips");
    }

    fillIn(otherTension, thisTension, otherMeasurements) {
        if (thisTension.stitchInput.value && otherTension.stitchInput.value) {
            const conversion = otherTension.stitchInput.value / thisTension.stitchInput.value;
            if (!this.chestInput.value && otherMeasurements.chestInput.value) {
                this.chestInput.value = conversion * otherMeasurements.chestInput.value;
            }
            if (!this.waistInput.value && otherMeasurements.waistInput.value) {
                this.waistInput.value = conversion * otherMeasurements.waistInput.value;
            }
            if (!this.hipsInput.value && otherMeasurements.hipsInput.value) {
                this.hipsInput.value = conversion * otherMeasurements.hipsInput.value;
            }
        }
        if (thisTension.rowInput.value && otherTension.rowInput.value) {
            const conversion = otherTension.rowInput.value / thisTension.rowInput.value;
            if (!this.lengthInput.value && otherMeasurements.lengthInput.value) {
                this.lengthInput.value = conversion * otherMeasurements.lengthInput.value;
            }
        }
    }
}

class Pattern {
    constructor(prefix) {
        this.tension = new Tension(prefix + "-tension");
        this.measurements = new Measurements(prefix + "-measure");
    }

    fillIn(otherPattern) {
        this.measurements.fillIn(otherPattern.tension, this.tension, otherPattern.measurements);
        this.tension.fillIn(otherPattern.tension, this.measurements, otherPattern.measurements);
    }
}

const source = new Pattern("pattern");
const you = new Pattern("you");
const form = document.getElementById("form");
form.onsubmit = () => {
    source.fillIn(you);
    you.fillIn(source);
    return false;
};