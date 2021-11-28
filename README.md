
> Open this page at [https://matthiasamberg.github.io/pxt-ledmatrix/](https://matthiasamberg.github.io/pxt-ledmatrix/)

# A micro:bit extension to drive WS2812b LED Matrices

## Features
* Supports different physical LED-matrix layouts (column or row major, zig-zag or progressive alignment (see [Adarfruits NeoMatrix Documentation](https://learn.adafruit.com/adafruit-neopixel-uberguide/neomatrix-library))
  * you can also use your LED-matrix rotated or upside down
* Emulates true RGB colors (RGB colors as you would see them on a computer screen)
* Supports GRB,RGB & GRBW LEDs
* RGB and HSL colors
* you can retrieve a LEDs set RGB value
* supports LED Strips (it's just a matrix with a height of 1)
* test pattern to help setup the physical matrix

### Setup / Detect the physical layout
Setup and attach your LED-matrix. 
Since LEDs matrices can have different physical setups. It is important to tell the makecode Editor some properties of your LED-Matrix.
Use [this code snippet](https://makecode.microbit.org/_cTu7bibW4cPg) to configure your matrix correctly:

Run the above snippet on your micro:bit.
Some LEDs should now light up, if not, you may need to check your connectors (or if you set the right pin in your block).
* In the first block ('set ledmatrix to...') set the width and height (in number of LEDs) correctly so it matches your physical LED-Matrix.

* Setup the color setting:
There are three different color modes you can choose from:
The two LEDs right next to the corner LEDs should constantly show red. If they don't your color mode is wrong. Try one of the other two color modes. The available formats are:
  * RGB (GRB Format)
  * RGB+W (GRBW Format)
  * RGB (RGB Format)

* Now you should have a white LED in a corner of your LED-Matrix and two red LEDs constantly lit. You must specify which corner that white LED is in. In the 'physical layout' block, set the 'first LED corner' parameter to one of the following and send the program to the microb:bit again:
  * top-left
  * top-right
  * bottom-left 
  * bottom-right
Now the white led should be in the top-left corner.

* There should be a pattern of LEDs blinking. If they start out horizontally (or the seem to move horizontally more often), then the LED direction is horizontal, otherwise vertical.
LED direction can be:
  * vertically
  * horizontally

* If the LED pattern zig-zags back and forth the row/columns continuation property is 'zig-zag'. If the LEDs always start on one side and move across, the continuation is progressive:
  * zig-zag
  * progressive

Now the light of the 'moving' testpattern should start in the top left corner and move horizontally to the reight, once it's at the end it should start on the left side again, one row down.
Once you setup the color mode, first LED corner, LED direction and continuation properties correctly, you are ready to use your LED-Matrix. You can now remove the 'test pattern' block and write your programs.


## Usage
See the [example code](https://makecode.microbit.org/_42jUPR7pDJDu) in the makecode editor.
* If your LED colors seem wrong then your LED strip might have a different color layout (see Setup above.)
* The 'x' coordinate is the horizontal coordinate (increases to the right)
* The 'y' coordinate is the vertical coordinate (increases downwards).

So the topmost-leftmost LED should have coordinates x=0 and y=0. 

The LED at the bottom right should have coordinates x=(matrixwidth-1) and y=(matrixheight-1).

If the coordinates produce unexpected results, you may need to setup your physical matrix with the 'physical layout' block (see Setup above).

### Advanced Usage
Auto Update

By default the LED Matrix gets updated after you update/set the color of an LED or any other operation (set brightness,...). This behaviour is simple but slow. Use the 'auto update LED matrix' block to disable this feature. However then you must use the 'update' Block whenever you want your changes pushed to the physical LEDs.


### Currently Missing Features / TODOs
* Simulator support
* Shifting LED patterns left/right or up/down.

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/matthiasamberg/pxt-ledmatrix** and import

## Edit this project ![Build status badge](https://github.com/matthiasamberg/pxt-ledmatrix/workflows/MakeCode/badge.svg)

To edit this repository in MakeCode.

* open [https://makecode.microbit.org/](https://makecode.microbit.org/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/matthiasamberg/pxt-ledmatrix** and click import

## Blocks preview

This image shows the blocks code from the last commit in master.
This image may take a few minutes to refresh.

![A rendered view of the blocks](https://github.com/matthiasamberg/pxt-ledmatrix/raw/master/.github/makecode/blocks.png)

#### Metadata (used for search, rendering)

* for PXT/microbit


<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
