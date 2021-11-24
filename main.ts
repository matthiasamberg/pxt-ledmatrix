enum Colors {
    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFFA500,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}
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
namespace LEDMatrix {

    /**
    * Support for ws2812b / LED Matrix / NeoPixel(TM) 2D Layouts
    *
    * Code partially copied and adapted from https://github.com/microsoft/pxt-neopixel/
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
        private brightness: number;
        private adjustedBrightness: number;
        private brightnessCurve: number[];

        private firstLEDPosition: FirstLEDPosition;
        private ledDirection: LEDDirection;
        private ledRowSetup: LEDRowSetup;

        private autoUpdate: boolean;

        constructor(pin: DigitalPin, matrixWidth: number, matrixHeight: number, mode: LEDColorMode) {
            this.pin = pin;
            this.matrixWidth = matrixWidth >> 0;
            this.matrixHeight = matrixHeight >> 0;
            this.ledColorMode = mode;

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
            this.brightnessCurve = [
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
            this.setBrightness(128);
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
        //% brightness.max=255 brightness.min=0 brightness.defl=128
        setBrightness(brightness: number) {
            // inspired by https://www.avrfreaks.net/comment/429531#comment-429531
            this.brightness = Math.max(Math.min(255, brightness >> 0), 0);
            // Math.pow does not work with floats on the actual micro:bit hence the LUT
            //this.adjustedBrightness = (Math.pow(2.0, ((this.brightness + 1) / 32)) - 1);
            this.adjustedBrightness = this.brightnessCurve[this.brightness];
            console.log(Math.pow(2, 3.5));

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
            red = (red * this.adjustedBrightness) >> 8;
            green = (green * this.adjustedBrightness) >> 8;
            blue = (blue * this.adjustedBrightness) >> 8;
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
            let byteOffset2 = this.getOffset(x, y) * this.stride;
            white = (white * this.adjustedBrightness) >> 8;
            this.buffer[byteOffset2 + 3] = white;
        }

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
    //% blockId="ledmatrix_create" block="ledMatrix at pin %pin which has width %matrixWidth and height %matrixHeight using %mode"
    //% weight=105 blockGap=8
    //% parts="ledmatrix"
    //% blockSetVariable=ledmatrix
    //% matrixWidth.defl=32
    //% matrixHeight.defl=8
    export function create(pin: DigitalPin, matrixWidth: number, matrixHeight: number, mode: LEDColorMode): LEDMatrix {
        let matrix = new LEDMatrix(pin, matrixWidth, matrixHeight, mode);
        return matrix;
    }

    /**
     * Test pattern for your Led Matrix
     * @param pin the pin where the led matrix is connected.
     */
    //% blockId="ledmatrix_test_pattern_led_matrix" block="update a test pattern on the LED Matrix at pin %pin using color mode %mode"
    //% weight=110 blockGap=8
    export function testPatternLEDMatrix(pin: DigitalPin, mode: LEDColorMode) {
        basic.pause(300)
        let striplength = 100;
        let matrix2 = create(pin, striplength, 1, mode);
        matrix2.setLEDColor(0, 0, 0xAAAAAA);
        matrix2.setLEDColor(1, 0, 0x900000);
        matrix2.setLEDColor(2, 0, 0x900000);
        matrix2.update();
        for (let j = 0; j < 10; j++) {
            for (let i = 3; i < striplength; i++) {
                matrix2.setLEDColor
                    (i, 0, 0x666666);
                matrix2.update();
                basic.pause(60)
                matrix2.setLEDColor
                    (i, 0, 0);
                matrix2.update();
            }
        }

    }


    // RGB Helper Functions also from the pxt-neopixel Project (Thank you!)

    /**
     * Converts red, green, blue channels into a RGB color
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% weight=94
    //% blockId="ledmatrix_rgb" block="red %red|green %green|blue %blue"
    //% red.max=255 red.min=0 red.defl=128
    //% green.max=255 green.min=0 green.defl=128
    //% blue.max=255 blue.min=0 blue.defl=128
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% weight=93 blockGap=8
    //% blockId="ledmatrix_colors" block="color %color"
    export function colors(color: Colors): number {
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
