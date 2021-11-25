
enum LEDColorMode {
    //% block="RGB (GRB format)"
    GRB = 1,
    //% block="RGB+W (GRBW format) "
    GRBW = 2,
    //% block="RGB (RGB format)  "
    RGB = 3
}
enum FirstLEDPosition {
    //% block="top left"
    topLeft = 1,
    //% block="top right"
    topRight = 2,
    //% block="bottom left"
    bottomLeft = 3,
    //% block="bottom right"
    bottomRight = 4
}
enum LEDDirection {
    //% block="horizontally"
    horizontal = 1,
    //% block="vertically"
    vertically = 2
}
enum LEDRowSetup {
    //% block="progressive"
    progressive = 1,
    //% block="zig-zag"
    zigZag = 2
}

//% weight=20 color=#63ADAD icon="\uf2a1"
namespace LEDMatrix {

    /**
    * Support for ws2812b / LED Matrix / NeoPixel(TM) 2D Layouts
    *
    * Code partially copied and/or adapted from https://github.com/microsoft/pxt-neopixel/
    */
    export class LEDMatrix {
        private buffer: Buffer;
        readonly pin: DigitalPin;
        private start: number; // start offset in LED strip
        readonly ledColorMode: LEDColorMode;
        readonly matrixHeight: number;
        readonly matrixWidth: number;
        readonly stride: number; // number of bytes needed per LED
        private colorMatrix: number[][];
        private whiteMatrix: number[][];
        //brightness in percent (from 0-100)
        private brightness: number;
        //brightness (fromm 0-255), adjusted for perceived brightness
        private adjustedBrightness: number;

        // the brightness curve to adjust for perceived brightness
        private trueBrightnessCurve: number[]; 

        // adjustedBrightnessCurve: the whole trueBrightnessCurve multiplied by the brightness (percentage)
        private adjustedBrightnessCurve: number[];

        //adjusted colors tries to adjust relative brightness of the RGBW leds
        //so that the leds reflect real RGB monitor perceived color
        private adjustedColors:boolean; 
        private firstLEDPosition: FirstLEDPosition;
        private ledDirection: LEDDirection;
        private ledRowSetup: LEDRowSetup;

        private autoUpdate: boolean;

        constructor(pin: DigitalPin, matrixWidth: number, matrixHeight: number, mode: LEDColorMode) {
            this.pin = pin;
            this.matrixWidth = matrixWidth >> 0;
            this.matrixHeight = matrixHeight >> 0;
            this.ledColorMode = mode;
            this.adjustedColors=true;

            //is properly set in this.setBrightness call below
            this.brightness = 0;
            this.adjustedBrightness = 0;

            this.firstLEDPosition = FirstLEDPosition.topLeft;
            this.ledDirection = LEDDirection.horizontal;
            this.ledRowSetup = LEDRowSetup.progressive;

            this.stride = this.ledColorMode === LEDColorMode.GRBW ? 4 : 3;
            this.autoUpdate = true;

            this.buffer = pins.createBuffer(matrixWidth * matrixHeight * this.stride);

            this.clear();

            //see discussion at https://www.avrfreaks.net/comment/429531#comment-429531
            this.trueBrightnessCurve = [
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 0, 0, 0, 0, 0, 0,
                0, 0, 1, 1, 1, 1, 1, 1,
                1, 1, 1, 1, 1, 1, 1, 1,
                1, 1, 1, 1, 1, 1, 1, 1,
                1, 1, 2, 2, 2, 2, 2, 2,
                2, 2, 2, 2, 2, 2, 2, 2,
                2, 3, 3, 3, 3, 3, 3, 3,
                3, 3, 3, 3, 3, 4, 4, 4,
                4, 4, 4, 4, 4, 4, 5, 5,
                5, 5, 5, 5, 5, 5, 6, 6,
                6, 6, 6, 6, 6, 7, 7, 7,
                7, 7, 8, 8, 8, 8, 8, 9,
                9, 9, 9, 9, 10, 10, 10, 10,
                11, 11, 11, 11, 12, 12, 12, 12,
                13, 13, 13, 14, 14, 14, 15, 15,
                15, 16, 16, 16, 17, 17, 18, 18,
                18, 19, 19, 20, 20, 21, 21, 22,
                22, 23, 23, 24, 24, 25, 25, 26,
                26, 27, 28, 28, 29, 30, 30, 31,
                32, 32, 33, 34, 35, 35, 36, 37,
                38, 39, 40, 40, 41, 42, 43, 44,
                45, 46, 47, 48, 49, 51, 52, 53,
                54, 55, 56, 58, 59, 60, 62, 63,
                64, 66, 67, 69, 70, 72, 73, 75,
                77, 78, 80, 82, 84, 86, 88, 90,
                91, 94, 96, 98, 100, 102, 104, 107,
                109, 111, 114, 116, 119, 122, 124, 127,
                130, 133, 136, 139, 142, 145, 148, 151,
                155, 158, 161, 165, 169, 172, 176, 180,
                184, 188, 192, 196, 201, 205, 210, 214,
                219, 224, 229, 234, 239, 244, 250, 255];
            this.setBrightness(75);
        }


        /**
         * Set information about how the physical LEDs are aligned in the matrix
         * @param position: In which corner the first LED sits on the physical matrix
         * @param direction: Whether the led direction is primarily veritcal or horizontal
         * @param rowDirection: Whether LEDs always go in the same direction per row or zig-zag back and forth
         */
        //% blockId="ledmatrix_set_matrix_layout" block="%ledMatrix physical layout:|First LED corner %position|  LED direction: %direction|  Rows/Columns continue %rowSetup"
        //% weight=100 blockGap=8
        //% parts="ledmatrix"
        setMatrixLayout(position: FirstLEDPosition, direction: LEDDirection, rowSetup: LEDRowSetup) {
            this.firstLEDPosition = position;
            this.ledDirection = direction;
            this.ledRowSetup = rowSetup;
        }

        /**
         * Set a LED color at coordinates x,y to an rgb colorvalue
         * @param x the x (horizontal) coordinate (0=leftmost)
         * @param y the y (vertical) coordinate (0=top)
         * @param rgb_color the rgb color value
         */
        //% blockId="ledmatrix_set_led_color" block="%ledMatrix|set LED color at coordinate x:%x y:%y to %rgb_color=ledmatrix_rgb"
        //% weight=95 blockGap=8
        //% parts="ledmatrix"
        setLEDColor(x: number, y: number, rgb_color: number) {
            if (x < 0 || x >= this.matrixWidth || y < 0 || y >= this.matrixHeight) {
                return;
            }
            this.colorMatrix[x][y] = rgb_color;
            this.setBufferRGB(x, y, unpackR(rgb_color), unpackG(rgb_color), unpackB(rgb_color));
            if (this.autoUpdate) {
                this.update();
            }
        }


        /**
         * Set a LED color at coordinates x,y to an rgb colorvalue
         * @param x the x (horizontal) coordinate (0=leftmost)
         * @param y the y (vertical) coordinate (0=top)
         * @param rgb_color the rgb color value
         */
        //% blockId="ledmatrix_fill_matrix" block="%ledMatrix|fill with color %rgb_color=ledmatrix_rgb"
        //% weight=65 blockGap=8
        //% parts="ledmatrix"
        fillMatrix(rgb_color: number) {
            for (let x = 0; x < this.matrixWidth;x++) {
                for (let y = 0; y < this.matrixHeight;y++) {
                    this.colorMatrix[x][y] = rgb_color;
                    this.setBufferRGB(x, y, unpackR(rgb_color), unpackG(rgb_color), unpackB(rgb_color));
                }
            }

            if (this.autoUpdate) {
                this.update();
            }
        }

        /**
         * Set the color of a led at coordinates x,y to an rgb colorvalue
         * @param x the x (horizontal) coordinate (0=leftmost)
         * @param y the y (vertical) coordinate (0=top)
         * @param whitelevel the brightness of the white led
         */
        //% blockId="ledmatrix_set_led_white" block="%ledMatrix|set LED white at coordinate x:%x y:%y to %whitelevel"
        //% weight=92 blockGap=8
        //% parts="ledmatrix"
        //% whitelevel.max=255 whitelevel.min=0 whitelevel.defl=128
        setLEDWhite(x: number, y: number, whitelevel: number) {
            if (x < 0 || x >= this.matrixWidth || y < 0 || y >= this.matrixHeight || this.ledColorMode != LEDColorMode.GRBW) {
                return;
            }
            this.colorMatrix[x][y] = whitelevel;
            this.setBufferWhite(x, y, whitelevel);
            if (this.autoUpdate) {
                this.update();
            }
        }

        /**
         * Set the overall brightness of the LED matrix.
         * @param brightness the brightness level
         */
        //% blockId="ledmatrix_set_brightness" block="%ledMatrix|set brightness to %brightness"
        //% weight=90 blockGap=8
        //% parts="ledmatrix"
        //% brightness.max=100 brightness.min=0 brightness.defl=50
        setBrightness(brightness: number) {
            // inspired by https://www.avrfreaks.net/comment/429531#comment-429531
            this.brightness = Math.max(Math.min(100, brightness >> 0), 0);
            // Math.pow does not work with floats on the actual micro:bit hence the LUT
            //this.adjustedBrightness = (Math.pow(2.0, ((this.brightness + 1) / 32)) - 1);
            this.adjustedBrightness = this.trueBrightnessCurve[(this.brightness*2.55)>>0];

            //update adjustedBrightnessCurve
            let brightnessFactor = this.brightness/100;
            for (let i=0;i<256;i++) {
                this.adjustedBrightnessCurve[i] = (this.trueBrightnessCurve[i] * brightnessFactor)>>0;
            }

            if (this.autoUpdate) {
                this.redraw();
            }
        }

        /**
         * Resets matrix to 'black'/off LEDS. 
         */
        //% blockId="ledmatrix_clear" block="%ledMatrix|clear"
        //% weight=90 blockGap=8
        //% parts="ledmatrix"
        clear() {
            this.buffer.fill(0);
            if (this.autoUpdate) {
                light.sendWS2812Buffer(this.buffer, this.pin);
            }
            this.colorMatrix = [];
            for (let x = 0; x < this.matrixWidth; x++) {
                this.colorMatrix[x] = [];
                for (let y = 0; y < this.matrixHeight; y++) {
                    this.colorMatrix[x][y] = 0;
                }
            }
            // initialize the white matrix if we are in GRBW Mode
            if (this.ledColorMode == LEDColorMode.GRBW) {
                this.whiteMatrix = [];
                for (let x2 = 0; x2 < this.matrixWidth; x2++) {
                    this.whiteMatrix[x2] = [];
                    for (let y2 = 0; y2 < this.matrixHeight; y2++) {
                        this.whiteMatrix[x2][y2] = 0;
                    }
                }
            }
        }

        /**
         * Updates the output buffer/every LED 
         */
        redraw() {

            for (let x3 = 0; x3 < this.matrixWidth; x3++) {
                for (let y3 = 0; y3 < this.matrixHeight; y3++) {
                    let rgb_color: number = this.colorMatrix[x3][y3];
                    this.setBufferRGB(x3, y3, unpackR(rgb_color), unpackG(rgb_color), unpackB(rgb_color));
                }
            }

            if (this.ledColorMode == LEDColorMode.GRBW) {
                for (let x4 = 0; x4 < this.matrixWidth; x4++) {
                    for (let y4 = 0; y4 < this.matrixHeight; y4++) {
                        this.setBufferWhite(x4, y4, this.whiteMatrix[x4][y4]);
                    }
                }
            }
            this.update();
        }

        private setBufferRGB(x: number, y: number, red: number, green: number, blue: number): void {
            let byteOffset = this.getOffset(x, y) * this.stride;

            if (this.adjustedColors) {
                //every color channel gets it's brightness adjustment individually 
                //should better reflect true RGB colors
                red = this.adjustedBrightnessCurve[red];
                green = this.adjustedBrightnessCurve[green];
                blue = this.adjustedBrightnessCurve[blue];
            } else {
                // all RGB channels use the same adjusted brightness
                // half the brightness setting should create a led that is perceived half as bright
                // without this half the brightness will half the power consumption but is perceived
                // as only minimally less bright (not half as bright)
                red = (red * this.adjustedBrightness) >> 8;
                green = (green * this.adjustedBrightness) >> 8;
                blue = (blue * this.adjustedBrightness) >> 8;
            }

            if (this.ledColorMode === LEDColorMode.RGB) {
                this.buffer[byteOffset + 0] = red;
                this.buffer[byteOffset + 1] = green;
            } else {
                this.buffer[byteOffset + 0] = green;
                this.buffer[byteOffset + 1] = red;
            }
            this.buffer[byteOffset + 2] = blue;
        }

        private setBufferWhite(x: number, y: number, white: number) {
            if (this.ledColorMode !== LEDColorMode.GRBW) {
                return;
            }
            let byteOffset = this.getOffset(x, y) * this.stride;

            if (this.adjustedColors) {
                //see comments in setBufferRGB
                white = this.adjustedBrightnessCurve[white];
            } else {
                white = (white * this.adjustedBrightness) >> 8;
            }
            this.buffer[byteOffset + 3] = white;
        }
        /**
         * calculates the offset of the led at coordinates (x,y) in the led strip 
         * this depends on the layout of the physical matrix
         */
        private getOffset(x: number, y: number): number {
            let offset = 0;
            let matrixWidth = this.matrixWidth;
            let matrixHeight = this.matrixHeight;

            // adjust x/y coordinates according to where the 'natural' 1st led lies on the physical matrix
            switch (this.firstLEDPosition) {
                // ignore topLeft, that is fine already
                case FirstLEDPosition.topRight: {
                    x = -x + matrixWidth - 1;
                    break;
                }
                case FirstLEDPosition.bottomRight: {
                    x = -x + matrixWidth - 1;
                    y = -y + matrixHeight - 1;
                    break;
                }
                case FirstLEDPosition.bottomLeft: {
                    y = -y + matrixHeight - 1;
                    break;
                }
            }

            if (this.ledDirection == LEDDirection.horizontal) {
                //flip x<->y and matrixWidth<->matrixHeight
                let tmp = x;
                x = y;
                y = tmp;
                tmp = this.matrixWidth;
                matrixWidth = this.matrixHeight;
                matrixHeight = tmp;
            }

            if (this.ledRowSetup == LEDRowSetup.progressive) {
                offset = x * matrixHeight + y;
            } else {
                //zig-zag
                if (x % 2 == 1) {
                    offset = (x + 1) * matrixHeight - 1 - y;
                } else {
                    offset = x * matrixHeight + y;
                }
            }
            return offset;
        }



        /*
        * Updates the LED matrix to update updated colors
        */
        //% blockId="ledmatrix_set_auto_update" block="%ledMatrix| auto update LED Matrix %autoUpdate "
        //% weight=95 blockGap=8
        //% parts="ledmatrix"
        //% advanced=true
        //% autoUpdate.shadow="toggleOnOff"
        setAutoUpdate(autoUpdate: boolean) {
            this.autoUpdate = autoUpdate;
        }

        /*
        * Updates the LED matrix to update updated colors
        */
        //% blockId="ledmatrix_update" block="%ledMatrix| update "
        //% weight=85 blockGap=8
        //% parts="ledmatrix"
        //% advanced=true
        update() {
            light.sendWS2812Buffer(this.buffer,this.pin);
        }

        /*
        * Updates the LED matrix to update updated colors
        */
        //% blockId="ledmatrix_test_pattern" block="%ledMatrix| test  "
        //% weight=85 blockGap=8
        //% parts="ledmatrix"
        //% advanced=true
        testPattern() {
            let r=255/2
            let g=128/2
            let b=50/2
            let x=0
            this.setAutoUpdate(false);
            this.pattern1(x, r, g, b);
            this.pattern2(++x, r, g, b);
            this.pattern3(++x, r, g, b);
            this.pattern1(++x, r, g, b);
            this.pattern2(++x, r, g, b);
            this.pattern3(++x, r, g, b);
            this.update();
        }

        pattern1(x: number, r: number, g: number, b: number) {

            for (let y = 0; y < 8; y++) {
                this.setLEDColor(x, y, packRGB(r, g, b))

                r /= 2;
                g /= 2;
                b /= 2;
            }
        }

        pattern2(x:number,r:number,g:number,b:number){
            let brightness:number=255;
            for (let y = 0; y < 8; y++) {
                this.setLEDColor(x, y, packRGB((this.trueBrightnessCurve[brightness] * r)>>8, (this.trueBrightnessCurve[brightness] * g)>>8, (this.trueBrightnessCurve[brightness] * b)>>8))
                brightness = (brightness*0.8)>>0;
            }
        }

        pattern3(x: number, r: number, g: number, b: number) {

            for (let y = 0; y < 8; y++) {
                this.setLEDColor(x, y, packRGB(this.trueBrightnessCurve[r], this.trueBrightnessCurve[g] , this.trueBrightnessCurve[b] ))
                r =(r*0.8)>>0;
                g = (g * 0.8) >> 0;
                b = (b * 0.8) >> 0;
            }
        }


        /**
         * Get the current led  color at coordinates x,y 
         * @param x the x (horizontal) coordinate (0=leftmost)
         * @param y the y (vertical) coordinate (0=top)
         * @returns rgb_color the rgb color value
         */
        //% blockId="ledmatrix_get_led_color" block="%ledMatrix|get the color of a LED at coordinate x:%x y:%y"
        //% weight=85 blockGap=8
        //% parts="ledmatrix"
        getLEDColor(x: number, y: number): number {
            if (x < 0 || x >= this.matrixWidth || y < 0 || y >= this.matrixHeight) {
                return 0;
            }
            return this.colorMatrix[x][y];
        }

        /**
         * Get the white led brightness/value at coordinates x,y 
         * @param x the x (horizontal) coordinate (0=leftmost)
         * @param y the y (vertical) coordinate (0=top)
         * @returns white the white led / brightness  value
         */
        //% blockId="ledmatrix_get_white_color" block="%ledMatrix|get the white brightness of a LED at coordinate x:%x y:%y"
        //% weight=83 blockGap=8
        //% parts="ledmatrix"
        getWhiteColor(x: number, y: number): number {
            if (x < 0 || x >= this.matrixWidth || y < 0 || y >= this.matrixHeight) {
                return 0;
            }
            return this.whiteMatrix[x][y];
        }

    }

    /**
     * Create a new LED Matrix.
     * @param pin the pin where the led matrix is connected.
     * @param matrixWidth the number of leds horizontally
     * @param matrixWidth the number of leds vertically
     * @param mode the byte packing mode of the led matrix : RedGreenBlue or GreenRedBlue, with or without add. white led
     */
    //% blockId="ledmatrix_create" block="ledMatrix at pin %pin with width %matrixWidth and height %matrixHeight using %mode"
    //% weight=105 blockGap=8
    //% parts="ledmatrix"
    //% blockSetVariable=ledmatrix
    //% matrixWidth.defl=32
    //% matrixHeight.defl=8
    //% inlineInputMode=inline
    export function create(pin: DigitalPin, matrixWidth: number, matrixHeight: number, mode: LEDColorMode): LEDMatrix {
        let matrix = new LEDMatrix(pin, matrixWidth, matrixHeight, mode);
        return matrix;
    }

    /**
     * Test pattern for your Led Matrix
     * @param pin the pin where the led matrix is connected.
     */
    //% blockId="ledmatrix_test_pattern_led_matrix" block="show a test pattern on the LED Matrix at pin %pin using color mode %mode"
    //% weight=110 blockGap=8
    export function testPatternLEDMatrix(pin: DigitalPin, mode: LEDColorMode) {
        basic.pause(300)
        let striplength = 100;
        let matrix = create(pin, striplength, 1, mode);
        matrix.setLEDColor(0, 0, 0xAAAAAA);
        matrix.setLEDColor(1, 0, 0x900000);
        matrix.setLEDColor(2, 0, 0x900000);
        matrix.update();
        for (let j = 0; j < 10; j++) {
            for (let i = 3; i < striplength; i++) {
                matrix.setLEDColor
                    (i, 0, 0x666666);
                matrix.update();
                basic.pause(60)
                matrix.setLEDColor
                    (i, 0, 0);
                matrix.update();
            }
        }

    }



    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=94
    //% blockId="ledmatrix_rgb" block="rgb-color red %red|green %green|blue %blue"
    //% red.max=255 red.min=0 red.defl=128
    //% green.max=255 green.min=0 green.defl=128
    //% blue.max=255 blue.min=0 blue.defl=128
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Converts hue, saturation, luminance  into a RGB color
     * @param hue hue value between 0 and 255. eg: 255
     * @param saturation saturation value between 0 and 255. eg: 255
     * @param luminance luminance value between 0 and 255. eg: 255
     *
     */
    //% weight=93
    //% blockId="ledmatrix_hsv" block="hsv-color: hue %hue|saturation %saturation|luminance %luminance"
    //% hue.max=360 hue.min=0 hue.defl=128
    //% saturation.max=100 saturation.min=0 saturation.defl=100
    //% luminance.max=100 luminance.min=0 luminance.defl=50
    export function hsv(hue: number, saturation: number, luminance: number): number {
        let h = hue;
        let s = saturation/100.0;
        let l = luminance/100.0;
        console.log(h+" "+s+" "+l);
        let c = (1 - Math.abs(2 * l - 1)) * s;
        let hp = h / 60.0;
        let x = c * (1 - Math.abs((hp % 2) - 1));
        let rgb1;
        if (isNaN(h)) rgb1 = [0, 0, 0];
        else if (hp <= 1) rgb1 = [c, x, 0];
        else if (hp <= 2) rgb1 = [x, c, 0];
        else if (hp <= 3) rgb1 = [0, c, x];
        else if (hp <= 4) rgb1 = [0, x, c];
        else if (hp <= 5) rgb1 = [x, 0, c];
        else if (hp <= 6) rgb1 = [c, 0, x];
        let m = l - c * 0.5;

        let rgb2=packRGB(Math.round(255 * (rgb1[0] + m)), Math.round(255 * (rgb1[1] + m)), Math.round(255 * (rgb1[2] + m)));
        console.log(unpackR(rgb2)+" "+unpackG(rgb2)+" "+unpackB(rgb2));
        return rgb2
    }

    //% weight=94
    //% blockId="ledmatrix_number_picker" block="color %color"
    //% red.max=255 red.min=0 red.defl=128
    //% color.shadow="colorNumberPicker"
    export function numberPicker(color: number): number {
        return color;
    }

    function packRGB(red: number, green: number, blue: number): number {
        return ((red & 0xFF) << 16) | ((green & 0xFF) << 8) | (blue & 0xFF);
    }

    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }

    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }

    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }
}
