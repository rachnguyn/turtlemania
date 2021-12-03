# turtlemania

## Introduction	<br>

A one-player game situated in a virtual aquarium, in which the player controls/moves a turtle through a series of 
arrow key interactions. The goal is to eat as many little fish as possible to earn "sand dollars" (points) used to decorate the 
aquarium, all while avoiding the sharks. The more fish the player eats, the more sand dollars they have earned to buy accessories, 
which are displayed on the menu bar at the top. The turtle has three lives and each time it is "eaten" by a shark, the turtle 
loses one life, the sharks will spawn faster and the turtle will scale slightly larger in size.

## Example Demo
![turtlemania](https://user-images.githubusercontent.com/91295945/144671500-05bc6433-7d39-4bbf-98fc-81bb4638f63d.gif)

## Run the Game
1) MacOS: ./host.command <br>
   Windows: host.bat <br>
2) Open browser and go to http://localhost:8080

## How to Play

- Press ENTER to start (can skip intro animation)
- Use the UP, DOWN, LEFT, RIGHT arrow keys to navigate the turtle
- Navigate turtle around sharks and collide with fish to eat them
- Click on the accessory you want from the menu bar on top and then click on the screen where you want to place it (will only spawn if you can afford the item)
- For additional functions such as lighting color change, off/on sound, and pause --> refer to bottom control panel 
- Players are encouraged to take a picture of your aquarium design once the game is over!
 
## Features

1) _**User Interaction (Movement Control):**_ player will navigate the turtle up, down, left, and right using the arrow keys
2) **Collision detection:** turtle interacting with prey and predator
   - 1st instance: turtle “eats” fish → remove fish and earn +2 points/sand dollars
   - 2nd instance: shark “eats” turtle → lose 1 life 
3) _**Dynamic Object Instantiation:**_ as game progresses sharks spawn at faster speeds 
4) _**Mouse Picking/Detection:**_ player is able to decorate the aquarium by clicking the the item <br>
   they want to buy and clicking an area on the screen where they want to place the item 
5) _**Shadows:**_ the animals swimming in the water casts shadows onto the sandy aquarium floor & onto default decorations 
6) _**Texture & Shading:**_ the fishes have scales and gradient-colored tails, the sharks have Gouraud shading, background environment 
uses an imported texture that rotates over time to mimic moving water, Jellyfish (purchasable item) have custom shading to mimic their transparency. 
7) _**Sound:**_ a chomping sound each time a turtle eats a fish and there is background music which can be toggled on and off
8) _**Lighting:**_ Light source from above that illuminates the entire tank, can change color when ‘c’ is pressed to mimic color-changing features of real life fish tanks
9) _**Camera:**_ Camera view is changed during the intro animation 
10) _**Animation:**_ Intro scene provides a storyline for the game + behavioral animation on jellyfish & squid to imitate its real-life movements

## Bugs
- Sharks may at times swim through each other 
- Sounds lag when triggered too immediately after another sound
- Placement of decorations/items often collides with other objects, may not be on the right z-axis  
- Turtle movement is not very smooth

## Contributors

Rachel Nguyen // rachelnguyn@gmail.com // rachnguyn 
- Set up foundation/environment, shadows, mouse picking + detection, animations, sound effects, camera & lighting, <br>
  scene graph (creating the animals), aesthetics (texture, custom shading, loading/start/pause/gameover screens, objects) 

Daniel Medina // dmedinag@g.ucla.edu // dmedinag29 
- Collision detection, point system, dynamic object instantiation, arrow-key interactions, texts

Kimberly Sung // wansung186@gmail.com // kimsung12
- Help with start & pause functions
