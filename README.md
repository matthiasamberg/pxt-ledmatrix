
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

## Usage
See the [example code](https://makecode.microbit.org/_42jUPR7pDJDu) in the makecode editor.
* If your LED colors seem wrong then your LED strip might have a different color layout (see Setup below)
* The 'x' coordinate is the horizontal coordinate (increases to the right)
* The 'y' coordinate is the vertical coordinate (increases downwards).

So the topmost-leftmost LED should have coordinates x=0 and y=0. 

The LED at the bottom right should have coordinates x=(matrixwidth-1) and y=(matrixheight-1).

If the coordinates produce unexpected results, you may need to setup your physical matrix with the 'physical layout' block (see Setup below).

### Advanced Usage
Auto Update

By default the LED Matrix gets updated after you update/set the color of an LED or any other operation (set brightness,...). This behaviour is simple but slow. Use the 'auto update LED matrix' block to disable this feature. However then you must use the 'update' Block whenever you want your changes pushed to the physical LEDs.

### Setup / Detect the physical layout
Setup and attach your LED-matrix. 

We need to figure out your physical matrix layout:
* Use the 'show a testpattern on the LED-matrix' block in the makecode editor and run it on your micro:bit.
Some LEDs should now light up, if not, you may need to check your connectors (or if you set the right pin in your block).
* Starting from a corner, there should be three LEDs constantly glowing. The one in the corner in white and then immediately adjacent two red LEDs. If the LEDs show a different color, you need to change the color mode in your 'testpattern' block. It's one of
  * RGB (GRB Format)
  * RGB+W (GRBW Format)
  * RGB (RGB Format)
* There is one white LED glowing in one of the matrix's corners. Make a note of the corner. The 'first LED corner' is either 
  * top-left
  * top-right
  * bottom-left 
  * bottom-right
* There should be a pattern of LEDs blinking. If they start out horizontally (or the seem to move horizontally more often), then the LED direction is horizontal, otherwise vertical.
LED direction can be:
  * vertically
  * horizontally
* If the LED pattern zig-zags back and forth the row/columns continuation is zig-zag. If the LEDs always start on one side and move across, the continuation is progressive:
  * zig-zag
  * progressive

You can now use this information to setup your matrix with the 'physical layout' block.

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
