import {defs, tiny} from './examples/common.js';
import { Shape_From_File } from './examples/obj-file-demo.js';
import { Text_Line } from './examples/text-demo.js';
import {Color_Phong_Shader, Shadow_Textured_Phong_Shader,
    Depth_Texture_Shader_2D, Buffered_Texture, LIGHT_DEPTH_TEX_SIZE} from './examples/shadow-demo-shaders.js'


const {
    Vector, Vector3, vec, vec3, vec4, color, hex_color, Matrix, Mat4, Light, Shape, Shader, Texture, Material, Scene,
} = tiny;

class Base_Scene extends Scene {
     // Base_scene is a Scene that can be added to any display canvas.
     // Setup the shapes, materials, camera, and lighting here.

    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();
        // start toggle
        this.startgame = false; 
        // pause toggle
        this.paused = false; 

        // set camera (game view)
        this.initial_camera_position = Mat4.translation(5, -10, -30); 

        // Sounds
        this.background_sound = new Audio("assets/naruto.mp3");
        this.click_sound = new Audio("assets/click.mp3");  
        this.munch_sound = new Audio("assets/munch.mp3"); 
        this.shark_sound = new Audio("assets/sharkbite.mp3"); 
        this.bling_sound = new Audio("assets/bling.mp3"); 
        this.loading_sound = new Audio("assets/backgroundmusic.mp3");
        this.gameover_sound = new Audio("assets/gameover.mp3"); 
        this.talking_sound = new Audio("assets/talking.mp3"); 
        this.woohoo_sound = new Audio("assets/woohooo.mp3"); 

        // Lighting 
        this.change_lighting_color = false;
        this.light_color = color(1,1,1,1);

        // Colors for Fish
        this.fish_color_array = [];
        this.set_fish_colors();

        // Mouse Position
        this.mousex;
        this.mousey;
       
        // Drawing queue for purchased items 
        this.userdraw = "none"; 
        this.item_queue = [];

        // Nest count for turtle hatch at game over 
        this.nest_count = 0;
        this.nest_location = [];

        // At the beginning of our program, load one of each of these shape definitions onto the GPU.
        this.shapes = {
            // basic shapes
            box: new defs.Cube(),
            sphere: new defs.Subdivision_Sphere(4),
            circle: new defs.Regular_2D_Polygon(50,50),
            square: new defs.Square(),
            
            // shapes for animals
            fishbody: new defs.Subdivision_Sphere(4),
            tail: new defs.Triangle(),
            turtlebody: new defs.Subdivision_Sphere(2),
            sharkbody: new defs.Subdivision_Sphere(2),
            snail: new Shape_From_File("assets/snail.obj"),

            // shapes for environment
            aquarium: new defs.Subdivision_Sphere(4),
            sand: new defs.Capped_Cylinder(50, 50, [[0, 2], [0, 1]]),

            // shapes for decorations / purchasable items 
            rock: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
            coral1: new Shape_From_File("assets/coral1.obj"),
            coral2: new Shape_From_File("assets/coral2.obj"),
            coral3: new Shape_From_File("assets/coral3.obj"),
            coral4: new Shape_From_File("assets/coral4.obj"),
            coral5: new Shape_From_File("assets/coral5.obj"),
            coral6: new Shape_From_File("assets/coral6.obj"),
            seashell: new Shape_From_File("assets/shell2.obj"),
            starfish: new Shape_From_File("assets/starfish.obj"),
            jellyfish: new Shape_From_File("assets/jellyfish.obj"),
            squid: new Shape_From_File("assets/squid.obj"),
            nest: new Shape_From_File("assets/nest.obj"),
            babyturtle: new Shape_From_File("assets/babyturtle.OBJ"),

            // unused items (can swap them out in menu bar if desired)
            treasurechest: new Shape_From_File("assets/treasurechest.obj"),
            nessy: new Shape_From_File("assets/nessy.obj"),
            poseidon: new Shape_From_File("assets/poseidon.obj"),
            temple: new Shape_From_File("assets/temple.obj"),

            // shape for text
            text: new Text_Line(35),
        };

        // Set fishbody texture to be zoomed in (bigger scales )
        this.shapes.fishbody.arrays.texture_coord = this.shapes.fishbody.arrays.texture_coord.map(x => x.times(0.5));
        
        // Textured Phong
        const textured = new defs.Textured_Phong(1);

        // Materials
        this.materials = {
            // menu 
            menu: new Material(textured,
                {ambient: 0.9, diffusivity: .9, texture: new Texture("assets/wood2.jpg")}),
            menubuttons: new Material(textured,
                {ambient: 0.9, diffusivity: 1, specularity: 1,  texture: new Texture("assets/bubble3.png")}),

            // environment 
            water: new Material(textured, {ambient: .5, texture: new Texture("assets/water.jpeg")}),
            sand: new Material(new Shadow_Textured_Phong_Shader(1), 
                {ambient: 0.3, diffusivity: .9, color: hex_color("#ffaf40"), smoothness: 64,
                color_texture: new Texture("assets/sand3.png"),
                light_depth_texture: null}),

            // animals
            shark: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#BFD8E0")}),              
            eye: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#000000")}),
            turtle: new Material(new Gouraud_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#548a62")}),
            turtlelimbs: new Material(new defs.Phong_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#33573c")}),
            guppies: new Material(textured,
                {ambient: .4, diffusivity: .6, texture: new Texture("assets/scale2.jpeg"), 
                smoothness: 64,
                color_texture: null,
                light_depth_texture: null}),                
            tails: new Material(new Tail_Shader(),
                {ambient: .4, diffusivity: .6, color: hex_color("#FBAB7F")}),
            snail: new Material(new Gouraud_Shader(),
                {ambient: 0.3, diffusivity: .6, specularity: 0, color: hex_color("#97ccb1")}),

            // deco / purchasable items 
            coral: new Material(new Shadow_Textured_Phong_Shader(1), 
                {ambient: 0.3, diffusivity: .9, specularity: 1, color: hex_color("#f28dae")}),
            jellyfish: new Material(new Jellyfish_Shader(), 
                {ambient: 0.3, diffusivity: .9, specularity: 1, color: hex_color("#f28dae")}),
            rock: new Material(new Shadow_Textured_Phong_Shader(1),
                {ambient: 0.6, diffusivity: .9, color: hex_color("#9c9c9c"), smoothness: 64,
                color_texture: null,
                light_depth_texture: null}),
            shelltexture: new Material(textured,
                {ambient: 1, color: hex_color("#000000"), texture: new Texture("assets/seashelltexture.jpg")}),
            gold: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/gold.jpg")}),
            redwood: new Material(textured,
                {ambient: 0.9, diffusivity: .9, texture: new Texture("assets/redwood.jpg")}),
            egg: new Material(new defs.Phong_Shader(),
                {ambient: .5, diffusivity: .6, specularity: 1, color: hex_color("#FFFFFF")}),

            // for loading, start, game over, pause, tips, life count, points/sand dollar count 
            text_image: new Material(textured, 
                {ambient: 1, diffusivity: 0, specularity: 0, texture: new Texture("assets/text.png")}),
            dash_board: new Material(textured,
                {ambient: 0.2, diffusivity: .9, color: hex_color("#000000")}),
            instructions: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/instructions01.png")}),
            startbackground: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, color: hex_color("#000000"), texture: new Texture("assets/sb2.png")}),
            pause: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/pause.png")}),
            tip1: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/tip1.png")}),
            tip2: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/tip2.png")}),
            tip3: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/tip3.png")}),
            tip4: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/tip4.png")}),
            tip5: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/tip5.png")}),
            sanddollar: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/sanddollar.png")}),
            heart: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/heart2.png")}),
            gameoverpic: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/gameover1.png")}),
            totalspent: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/totalspent1.png")}),
            takepix: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/takephoto.png")}),
            livestext: new Material(textured, 
                {ambient: 1, diffusivity: .9, specularity: 1, texture: new Texture("assets/lives3.png")}),
        };

       // floor --> prepared for shadows
        this.floor = new Material(new Shadow_Textured_Phong_Shader(1), 
                {ambient: 0.3, diffusivity: .9, color: hex_color("#ffaf40"), smoothness: 64,
                color_texture: new Texture("assets/sand3.png"),
                light_depth_texture: null})

        // for the first pass
        this.pure = new Material(new Color_Phong_Shader(), {
        })
        // for light source
        this.light_src = new Material(new defs.Phong_Shader(), {
            color: color(1, 1, 1, 1), ambient: 1, diffusivity: 0, specularity: 0
        });
        // for depth texture display
        this.depth_tex =  new Material(new Depth_Texture_Shader_2D(), {
            color: color(0, 0, .0, 1),
            ambient: 1, diffusivity: 0, specularity: 0, texture: null
        });

        // to ensure texture initialization only does once
        this.init_ok = false;

        /* Turtle coordinates */
        this.y_movement = 0;
        this.x_movement = 0;
        
        /* Coordinates and time offsets for fishes & sharks */
        this.x_spawn_left = Array.from({length: 5}, () => Math.floor(Math.random() * (-100 +30) -30));
        this.y_spawn_left = Array.from({length: 5}, () => Math.floor(Math.random() * 18));
        this.time_offsets_left = Array(5).fill(0);

        this.x_spawn_right = Array.from({length: 5}, () => Math.floor(Math.random() * (100 - 30) + 30));
        this.y_spawn_right = Array.from({length: 5}, () => Math.floor(Math.random() * 18));
        this.time_offsets_right = Array(5).fill(0);

        this.x_shark_spawn_left = Array.from({length: 3}, () => Math.floor(Math.random() * (-100 + 30) -30));
        this.y_shark_spawn_left = [2, 7, 13];
        
        this.time_shark_offsets_left = Array(5).fill(0);

        this.x_shark_spawn_right = Array.from({length: 3}, () => Math.floor(Math.random() * (100 - 30) + 30));
        this.y_shark_spawn_right = [4, 10, 17];
        this.time_shark_offsets_right = Array(5).fill(0);

        // Used to keep track of scaling of turtle during collision detection        
        this.turtle_body_global = Mat4.identity();
        this.turtle_head_global = Mat4.identity();
        this.turtle_larm_global = Mat4.identity();
        this.turtle_rarm_global = Mat4.identity();
        this.turtle_lleg_global = Mat4.identity();
        this.turtle_rleg_global = Mat4.identity();

        // Used to readjust sensitivity of collisoin detection when turtle grows/decreases
        this.collision_count = 0;
        this.sand_dollars = 0;
        this.total_spent = 0;
        this.lifes = 3;
        this.draw_in_prog = false;
        this.offset = 0;
        this.left_shark_count = 3;
        this.right_shark_count = 3;
        
;
    }
}

export class TurtleMania extends Base_Scene {  

   texture_buffer_init(gl) {
        // Depth Texture
        this.lightDepthTexture = gl.createTexture();
        // Bind it to TinyGraphics
        this.light_depth_texture = new Buffered_Texture(this.lightDepthTexture);
        this.floor.light_depth_texture = this.light_depth_texture;

        this.lightDepthTextureSize = LIGHT_DEPTH_TEX_SIZE;
        gl.bindTexture(gl.TEXTURE_2D, this.lightDepthTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,      // target
            0,                  // mip level
            gl.DEPTH_COMPONENT, // internal format
            this.lightDepthTextureSize,   // width
            this.lightDepthTextureSize,   // height
            0,                  // border
            gl.DEPTH_COMPONENT, // format
            gl.UNSIGNED_INT,    // type
            null);              // data
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // Depth Texture Buffer
        this.lightDepthFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,       // target
            gl.DEPTH_ATTACHMENT,  // attachment point
            gl.TEXTURE_2D,        // texture target
            this.lightDepthTexture,         // texture
            0);                   // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // create a color texture of the same size as the depth texture
        // see article why this is needed_
        this.unusedTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            this.lightDepthTextureSize,
            this.lightDepthTextureSize,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        // attach it to the framebuffer
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,        // target
            gl.COLOR_ATTACHMENT0,  // attachment point
            gl.TEXTURE_2D,         // texture target
            this.unusedTexture,         // texture
            0);                    // mip level
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    render_scene(context, program_state, shadow_pass, draw_light_source=false, draw_shadow=false) {
        // shadow_pass: true if this is the second pass that draw the shadow.
        // draw_light_source: true if we want to draw the light source.
        // draw_shadow: true if we want to draw the shadow

        let light_position = this.light_position;
        let light_color = this.light_color;
        const t = program_state.animation_time, dt = program_state.animation_delta_time / 1000;

        program_state.draw_shadow = draw_shadow;

        let model_transform = Mat4.identity();
        
        // Draw aquarium background (sphere w/ water texture)
        let background_transform = model_transform.times(Mat4.scale(60, 60, 60))
                                                  .times(Mat4.rotation(0, 0, 1, 0))
                                                  .times(Mat4.rotation(Math.PI/1.8 , 1, 0, 0))
                                                  .times(Mat4.rotation(t/40000, 0, 1, 0));
        
        this.shapes.aquarium.draw(context, program_state, background_transform, this.materials.water);

        // Draw aquarium floor (capped cylinder)
        let sand_transform = model_transform.times(Mat4.rotation(0, 0, 1, 0))
                                            .times(Mat4.rotation(Math.PI/2, 1, 0, 0))
                                            .times(Mat4.translation(0, 0, 2))
                                            .times(Mat4.scale(50, 25, 0.5));

        this.shapes.sand.draw(context, program_state, sand_transform, this.floor);

        // Draw menu bar if lifes are not 0
        if(this.lifes != 0){
            this.draw_menu_bar(context, program_state, model_transform, t/1000);
        }

        // Draw default aquarium decorations 
        const max_coral_angle = .01 * Math.PI;
        var coral_sway = ((max_coral_angle/2) + (max_coral_angle/2) * (Math.sin(Math.PI*(t/1000*1.2))));


        
        let pink_coral_transform = model_transform.times(Mat4.translation(-22,0,-17,0))
                                              .times(Mat4.scale(4,4,4,0))
                                              .times(Mat4.rotation(-coral_sway, 0,0,1))
        this.shapes.coral1.draw(context, program_state, pink_coral_transform, shadow_pass? this.materials.coral : this.pure);

        let lightgreen_coral_transform = model_transform.times(Mat4.translation(-18,0,-17,0))
                                              .times(Mat4.scale(4,4,3,0))
                                              .times(Mat4.rotation(coral_sway, 0,0,1));    
        this.shapes.coral2.draw(context, program_state, lightgreen_coral_transform, shadow_pass? this.materials.coral.override({color:hex_color("#8df2aa")}) : this.pure);

        let purple_coral_transform = model_transform.times(Mat4.translation(-27,0,-17,0))
                                              .times(Mat4.scale(4,6,4,0))
                                              .times(Mat4.rotation(360,0,0,1))
                                              .times(Mat4.rotation(coral_sway, 0,0,1));
        this.shapes.coral2.draw(context, program_state, purple_coral_transform, shadow_pass? this.materials.coral.override({color:hex_color("#947fb8")}) : this.pure);

        let orange_coral_transform = model_transform.times(Mat4.translation(15,0,-16,0))
                                              .times(Mat4.scale(2,3,3,0))
                                              .times(Mat4.rotation(-33,1,0,0))
                                              .times(Mat4.rotation(coral_sway, 0,0,1));
        this.shapes.coral6.draw(context, program_state, orange_coral_transform, shadow_pass? this.materials.coral.override({color:hex_color("#ffaf6e")}) : this.pure);

        let periwinkle_coral_transform = model_transform.times(Mat4.translation(16,0,-22,0))
                                              .times(Mat4.scale(5,6,3,0))
                                              .times(Mat4.rotation(-coral_sway, 0,0,1));
        this.shapes.coral1.draw(context, program_state, periwinkle_coral_transform, shadow_pass? this.materials.coral.override({color:hex_color("#6d85c2")}) : this.pure);

        let green_coral_transform = model_transform.times(Mat4.translation(22,6,-16,0))
                                              .times(Mat4.scale(3,4,3,0))
                                              .times(Mat4.rotation(-33,1,0,0))
                                              .times(Mat4.rotation(-coral_sway, 1,0,0));
        this.shapes.coral4.draw(context, program_state, green_coral_transform, shadow_pass? this.materials.coral.override({color:hex_color("#a2e677")}) : this.pure);

        let rock1_transform = model_transform.times(Mat4.translation(-34,0,-17,0))
                                             .times(Mat4.scale(4,5,4,0));
        this.shapes.rock.draw(context, program_state, rock1_transform, shadow_pass? this.materials.rock : this.pure);

        let snail_transform = model_transform.times(Mat4.translation(-28,-1,-1,0))    
                                             .times(Mat4.rotation(-33,1,0,0))
                                             .times(Mat4.rotation(33,0,0,1))
                                             .times(Mat4.translation(0,-t/1000/8,0,0))
        this.shapes.snail.draw(context, program_state, snail_transform, shadow_pass? this.materials.snail : this.pure);
        

         // Fill scene with fish & shark 
        let left_fish_count = 1;
        let right_fish_count = 5;
        let shark_left_count = this.left_shark_count;
        let shark_right_count = this.right_shark_count;
        let fish_speed = 3;
        let shark_speed = 3 + (3 - this.lifes)*4;

        // X,Y for turtle position --> controlled by player using arrow keys 
        var y = this.y_movement;
        var x = this.x_movement;
        let max_flipper_angle = .05 * Math.PI;
        let flipper_rot = ((max_flipper_angle/2) + (max_flipper_angle/2) * (Math.sin(Math.PI*(t/1000*1.2))));

        // Draws turtle after drawing sharks and fishes 
        if(this.lifes != 0){

                var turtle_body = model_transform.times(Mat4.scale(1.5,1.8,1,0))
                                                       .times(Mat4.translation(x/2,y/4,0,0))
                                                       .times(this.turtle_body_global);

                let turtle_head = model_transform.times(Mat4.translation(0, 1.9, 0, 0))
                                                       .times(Mat4.scale(0.5,0.5,0.2,0))
                                                       .times(Mat4.translation(x*1.5,y/1.1,0,0))
                                                       .times(this.turtle_head_global);

                let turtle_leg_tl_transform = model_transform.times(Mat4.translation(0, 1, 0, 0))
                                                       .times(Mat4.scale(0.8,0.4,0.2,0))
                                                       .times(Mat4.translation(x*0.94,y*1.1,0,0))
                                                       .times(Mat4.rotation(flipper_rot, 0,1,1))
                                                       .times(Mat4.translation(-1.9, 0.5, 0.2, 0))
                                                       .times(this.turtle_larm_global);

                let turtle_leg_bl_transform = model_transform.times(Mat4.translation(0, -0.4, 0, 0))
                                                       .times(Mat4.scale(0.8,0.4,0.2,0))
                                                       .times(Mat4.translation(x*0.94,y*1.1,0,0))
                                                       .times(Mat4.rotation(flipper_rot, 0,1,1))
                                                       .times(Mat4.translation(-1.9, -0.5, 0.2, 0))
                                                       .times(this.turtle_lleg_global);

                let turtle_leg_tr_transform = model_transform.times(Mat4.translation(0, 1, 0, 0))
                                                       .times(Mat4.scale(0.8,0.4,0.2,0))
                                                       .times(Mat4.translation(x*0.94,y*1.1,0,0))
                                                       .times(Mat4.rotation(-flipper_rot, 0,1,1))
                                                       .times(Mat4.translation(1.9, 0.5, 0.1, 0))
                                                       .times(this.turtle_rarm_global);

                let turtle_leg_br_transform = model_transform.times(Mat4.translation(0, -0.4, 0, 0))
                                                       .times(Mat4.scale(0.8,0.4,0.2,0))
                                                       .times(Mat4.translation(x*0.94,y*1.1,0,0))
                                                       .times(Mat4.rotation(-flipper_rot, 0,1,1))
                                                       .times(Mat4.translation(1.9, -0.5, 0.1, 0))
                                                       .times(this.turtle_rleg_global);

                this.shapes.turtlebody.draw(context, program_state, turtle_body, shadow_pass? this.materials.turtle : this.pure);
                this.shapes.fishbody.draw(context, program_state, turtle_head, shadow_pass? this.materials.turtlelimbs : this.pure);
                this.shapes.fishbody.draw(context, program_state, turtle_leg_tl_transform, shadow_pass? this.materials.turtlelimbs : this.pure);
                this.shapes.fishbody.draw(context, program_state, turtle_leg_bl_transform, shadow_pass? this.materials.turtlelimbs : this.pure);
                this.shapes.fishbody.draw(context, program_state, turtle_leg_tr_transform, shadow_pass? this.materials.turtlelimbs : this.pure);
                this.shapes.fishbody.draw(context, program_state, turtle_leg_br_transform, shadow_pass? this.materials.turtlelimbs : this.pure);                
        }


        /*These for loops draw fishes and sharks and call collsion detection functions*/
         
        if(this.lifes != 0){
            if(this.startgame){

                for(let i = 0; i < left_fish_count; i++)
                {
                    this.draw_fishes_left(context, program_state, model_transform, i, t/1000, fish_speed, shadow_pass);
                    if (this.paused){
                        this.detect_fish_collision_left(i, t/1000, 0);
                        this.shapes.square.draw(context, program_state, model_transform.times(Mat4.translation(-5,10,10,0)).times(Mat4.scale(5.5, 5.5, 5.5)),this.materials.pause);                                           
                    }
                    else 
                        this.detect_fish_collision_left(i, t/1000, fish_speed);
                }
                for(let i = 0; i < right_fish_count; i++){
                    this.draw_fishes_right(context, program_state, model_transform, i, t/1000, fish_speed, shadow_pass);
                    if (this.paused)
                        this.detect_fish_collision_right(i, t/1000, 0);
                    else
                        this.detect_fish_collision_right(i, t/1000, fish_speed);
                }
                for(let i = 0; i < shark_left_count; i++){
                    this.draw_shark_left(context, program_state, model_transform, i, t/1000, shark_speed, shadow_pass);
                    if (this.paused)
                        this.detect_shark_collision_left(i, t/1000, 0);
                    else
                        this.detect_shark_collision_left(i, t/1000, shark_speed);
                }
                for(let i = 0; i < shark_right_count; i++){
                    this.draw_shark_right(context, program_state, model_transform, i, t/1000, shark_speed, shadow_pass);
                    if (this.paused)
                        this.detect_shark_collision_left(i, t/1000, 0);                        
                    else
                        this.detect_shark_collision_right(i, t/1000, shark_speed);
                }   
            }               
        }

        // if game has not started yet --> queue loading screen + intro animation 
        if (!this.startgame){

                // set loading screen time
                const time_in_sec = t/1000; 
                const time_loading_screen = 0;
                const time_loading_screen_end = 9;
              
                // draw loading screen with fish animations
                if (time_in_sec > time_loading_screen && time_in_sec < time_loading_screen_end) {
                    this.loading_sound.play();
                    this.shapes.square.draw(context, program_state, model_transform.times(Mat4.translation(-5,9,10,0)).times(Mat4.scale(15, 10, 1)),this.materials.eye);   

                    let loading_transform = Mat4.identity().times(Mat4.translation(-7.5,13,11,0)).times(Mat4.scale(1.2,1.2,0.2,5));
                    this.shapes.text.set_string("loading...", context.context);
                    this.shapes.text.draw(context, program_state, loading_transform.times(Mat4.scale(.35, .35, .50)), this.materials.text_image);

                    let max_angle = .1 * Math.PI;
                    let tail_rot = ((max_angle/2) + (max_angle/2) * (Math.sin(Math.PI*(t/1000*4))));

                    const time_in_sec = t/1000; 
                    const time_fish1 = 3;

                    if (time_in_sec > time_fish1) {
                        let fish1_trans = model_transform.times(Mat4.translation(-15, 10, 11))
                                                  .times(Mat4.scale(0.8,0.6,0.5,1));

                        this.shapes.fishbody.draw(context, program_state, fish1_trans, shadow_pass? this.materials.guppies.override({color: hex_color("#eb2667")}) : this.pure);

                        let tail1_trans = model_transform.times(Mat4.translation(-15.5, 10, 11))
                                                 .times(Mat4.scale(1,1,1,1))
                                                 .times(Mat4.rotation(-73,0,0,1))
                                                 .times(Mat4.rotation(tail_rot,0,1,0));
                        this.shapes.tail.draw(context, program_state, tail1_trans, shadow_pass? this.materials.tails.override({color: hex_color("#eb2667")}) : this.pure);  
                    }

                    const time_fish2 = 4;

                    if (time_in_sec > time_fish2) {
                        let fish2_trans = model_transform.times(Mat4.translation(-10, 10, 11))
                                                      .times(Mat4.scale(0.8,0.6,0.5,1));

                        this.shapes.fishbody.draw(context, program_state, fish2_trans, shadow_pass? this.materials.guppies.override({color: hex_color("#ff8921")}) : this.pure);

                        let tail2_trans = model_transform.times(Mat4.translation(-10.5, 10, 11))
                                                     .times(Mat4.scale(1,1,1,1))
                                                     .times(Mat4.rotation(-73,0,0,1))
                                                     .times(Mat4.rotation(tail_rot,0,1,0));
                        this.shapes.tail.draw(context, program_state, tail2_trans, shadow_pass? this.materials.tails.override({color: hex_color("#ff8921")}) : this.pure);  
                    }

                    const time_fish3 = 5;

                    if (time_in_sec > time_fish3) {

                        let fish3_trans = model_transform.times(Mat4.translation(-5, 10, 11))
                                                      .times(Mat4.scale(0.8,0.6,0.5,1));

                        this.shapes.fishbody.draw(context, program_state, fish3_trans, shadow_pass? this.materials.guppies.override({color: hex_color("#b2fc81")}) : this.pure);

                        let tail3_trans = model_transform.times(Mat4.translation(-5.5, 10, 11))
                                                     .times(Mat4.scale(1,1,1,1))
                                                     .times(Mat4.rotation(-73,0,0,1))
                                                     .times(Mat4.rotation(tail_rot,0,1,0));
                        this.shapes.tail.draw(context, program_state, tail3_trans, shadow_pass? this.materials.tails.override({color: hex_color("#b2fc81")}) : this.pure);         
                    }

                    const time_fish4 = 6;

                    if (time_in_sec > time_fish4) {

                        let fish4_trans = model_transform.times(Mat4.translation(0, 10, 11))
                                                      .times(Mat4.scale(0.8,0.6,0.5,1));

                        this.shapes.fishbody.draw(context, program_state, fish4_trans, shadow_pass? this.materials.guppies.override({color: hex_color("#70aad4")}) : this.pure);

                        let tail4_trans = model_transform.times(Mat4.translation(-.5, 10, 11))
                                                     .times(Mat4.scale(1,1,1,1))
                                                     .times(Mat4.rotation(-73,0,0,1))
                                                     .times(Mat4.rotation(tail_rot,0,1,0));
                        this.shapes.tail.draw(context, program_state, tail4_trans, shadow_pass? this.materials.tails.override({color: hex_color("#70aad4")}) : this.pure);         

                    }

                    const time_fish5 = 7;

                    if (time_in_sec > time_fish5) {
                        let fish5_trans = model_transform.times(Mat4.translation(5.0, 10, 11))
                                                     .times(Mat4.scale(0.8,0.6,0.5,1));

                        this.shapes.fishbody.draw(context, program_state, fish5_trans, shadow_pass? this.materials.guppies.override({color: hex_color("#956cbd")}) : this.pure);

                        let tail5_trans = model_transform.times(Mat4.translation(4.5, 10, 11))
                                                     .times(Mat4.scale(1,1,1,1))
                                                     .times(Mat4.rotation(-73,0,0,1))
                                                     .times(Mat4.rotation(tail_rot,0,1,0));
                        this.shapes.tail.draw(context, program_state, tail5_trans, shadow_pass? this.materials.tails.override({color: hex_color("#956cbd")}) : this.pure);                  
                    }
                } // end of loading screen 

                // after loading screen --> turtle animation / intro 
                let zoominturtle = 9;
                let zoominturtlenend = 14;

                // move camera around environment, stop at turtle 
                if (time_in_sec > zoominturtle && time_in_sec < zoominturtlenend){
                        let newcam = Mat4.translation(-6,-5,7);
                        program_state.set_camera(newcam);
                        program_state.set_camera(newcam.times(Mat4.translation(t/300, t/600, -t/70))
                        .times(Mat4.rotation(Math.sin(t/1475), 0, 1, 0)).map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1)));

                }

                let talking_scene = 13.98;
                let talking_scene_end = 28.5;

                // queue talking noises to mimic turtle talking
                if (time_in_sec > talking_scene && time_in_sec < talking_scene_end){
                    this.talking_sound.play();
                }

                // start dialogue
                let scene2 = 13.98;
                let scene2end = 15.5;
                if (time_in_sec > scene2 && time_in_sec < scene2end){
                    let text1_trans = Mat4.translation(-3, 5, 0).times(Mat4.scale(0.7,0.7,1));
                    this.shapes.text.set_string("Hello!", context.context);
                    this.shapes.text.draw(context, program_state, text1_trans, this.materials.text_image);
                }

                let scene3 = 15.5;
                let scene3end = 19.5;
                if (time_in_sec > scene3 && time_in_sec < scene3end){
                    let text1_trans = Mat4.translation(-4, 6, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("I'm Turtle, and", context.context);
                    this.shapes.text.draw(context, program_state, text1_trans, this.materials.text_image);
                    let text2_trans = Mat4.translation(-4, 5.2, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("this is my home!", context.context);
                    this.shapes.text.draw(context, program_state, text2_trans, this.materials.text_image);
                }
                let scene4 = 19.5;
                let scene4end = 23.5;
                if (time_in_sec > scene4 && time_in_sec < scene4end){
                    let text1_trans = Mat4.translation(-5, 6, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("Recently, sharks have ", context.context);
                    this.shapes.text.draw(context, program_state, text1_trans, this.materials.text_image);
                    let text2_trans = Mat4.translation(-4.5, 5.2, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("invaded the area!", context.context);
                    this.shapes.text.draw(context, program_state, text2_trans, this.materials.text_image);
                }
                let scene5 = 23.5;
                let scene5end = 31;
                if (time_in_sec > scene5 && time_in_sec < scene5end){
                    let text1_trans = Mat4.translation(-6, 6.5, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("Please help me gain energy", context.context);
                    this.shapes.text.draw(context, program_state, text1_trans, this.materials.text_image);
                    let text2_trans = Mat4.translation(-5.5, 5.7, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("back so I can call this", context.context);
                    this.shapes.text.draw(context, program_state, text2_trans, this.materials.text_image);
                    let text3_trans = Mat4.translation(-4.8, 4.9, 0).times(Mat4.scale(0.3,0.3,1));
                    this.shapes.text.set_string("place my home again!", context.context);
                    this.shapes.text.draw(context, program_state, text3_trans, this.materials.text_image);
                }

                // end dialogue --> turn off talking sound 
                if (time_in_sec > talking_scene_end){
                        this.talking_sound.pause();
                }

                // send camera back to original position (game view)
                let introsceenend = 31;
                let introsceenendend = 32.5;  
                if (time_in_sec > introsceenend && time_in_sec < introsceenendend){
                    program_state.camera_inverse = this.initial_camera_position
                    .map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));
                }

                // draw start screen with instructions 
                let startscreen = 31;
                if (time_in_sec > startscreen){
                    this.shapes.square.draw(context, program_state, model_transform.times(Mat4.translation(-5,9,9,0)).times(Mat4.scale(16, 10, 1)),this.materials.startbackground);   
                    this.shapes.square.draw(context, program_state, model_transform.times(Mat4.translation(-5,9,10,0)).times(Mat4.scale(6.2, 6.2, 1)),this.materials.instructions);   
                }

         }

        // else, if game has started (also allows user to press 'enter' and skip intro) 
        // --> turn off loading sound + talking sound + set camera back to game view + add tips 
        if (this.startgame){
            // stop loading music 
            this.loading_sound.pause();
            this.talking_sound.pause();

            // set camera to game view
            program_state.camera_inverse = this.initial_camera_position
                    .map((x,i) => Vector.from(program_state.camera_inverse[i]).mix(x, 0.1));

            // draw tips at time intervals
            const time_in_sec = t/1000; 
            let tip1time = 50;
            let tip1timeend = 60;
            var tip_transform = Mat4.identity().times(Mat4.translation(6.5,12,3,0)).times(Mat4.scale(1.2,1.2,0.2,5));
            
            // tip 1: tell user that sharks spawn faster when a life is lost 
            if (time_in_sec > tip1time && time_in_sec < tip1time + 1){
                this.bling_sound.play();
            }
            if (time_in_sec > tip1time && time_in_sec < tip1timeend) {
                this.shapes.square.draw(context, program_state, tip_transform.times(Mat4.scale(7, 7, 1)), this.materials.tip1);
            }

            // tip 2: tell user they can pause game
            let tip2time = 70;
            let tip2timeend = 80;

            if (time_in_sec > tip2time && time_in_sec < tip2time + 1){
                this.bling_sound.play();
            }
            if (time_in_sec > tip2time && time_in_sec < tip2timeend) {
                this.shapes.square.draw(context, program_state, tip_transform.times(Mat4.scale(7, 7, 1)), this.materials.tip4);
            }

            // tip 3: tell user they can stop music
            let tip3time = 90;
            let tip3timeend = 100;

            if (time_in_sec > tip3time && time_in_sec < tip3time + 1){
                this.bling_sound.play();
            }
            if (time_in_sec > tip3time && time_in_sec < tip3timeend) {
                this.shapes.square.draw(context, program_state, tip_transform.times(Mat4.scale(7, 7, 1)), this.materials.tip3);
            }

            // tip 4: tell user they can change aquarium lighting color 
            let tip4time = 110;
            let tip4timeend = 120;

            if (time_in_sec > tip4time && time_in_sec < tip4time + 1){
                this.bling_sound.play();
            }
            if (time_in_sec > tip4time && time_in_sec < tip4timeend) {
                this.shapes.square.draw(context, program_state, tip_transform.times(Mat4.scale(7, 7, 1)), this.materials.tip2);
            }

            // tip 5: remind user to spend sand dollars 
            let tip5time = 130;
            let tip5timeend = 140;

            if (time_in_sec > tip5time && time_in_sec < tip5time + 1){
                this.bling_sound.play();
            }
            if (time_in_sec > tip5time && time_in_sec < tip5timeend) {
                this.shapes.square.draw(context, program_state, tip_transform.times(Mat4.scale(7, 7, 1)), this.materials.tip5);
            }
        }
       
        
        // If player has purchased decorations --> draw them here 
        if (this.item_queue.length > 0) {
            for (let i = 0; i < this.item_queue.length; i++) {
                let ts = t/1000;
                let obj = this.item_queue[i];
                let position = obj.pos;
                let size = obj.size;
                let color = obj.color;
                let negorpos = obj.negorpos; 
                let transform = Mat4.translation(position[0], position[1], position[2])
                                    .times(Mat4.scale(size, size, size, 0));
 
                // if coral --> add sway effect 
                var coral_angle = .01 * Math.PI;
                var coral_sway = ((coral_angle/2) + (coral_angle/2) * (Math.sin(Math.PI*(ts*1.2))));
                
                // check which item was purchased 
                if (obj.object == "coral1") {
                    transform = transform.times(Mat4.rotation(coral_sway, 0,0,1))
                    // straighten up coral (it tilts due to perspective projection)
                    if (position[0] < 0){
                        transform = transform.times(Mat4.rotation(-0.1, 0,0,1))
                    }
                    if (position[0] > 0){
                        transform = transform.times(Mat4.rotation(0.1, 0,0,1))
                    }
                    this.shapes.coral1.draw(context, program_state, transform, this.materials.coral.override({color:color}));
                }

                if (obj.object == "coral2") {
                    transform = transform.times(Mat4.rotation(coral_sway, 0,0,1))
                                         .times(Mat4.scale(0.7, 0.7,0.7,1))
                    this.shapes.coral2.draw(context, program_state, transform, this.materials.coral.override({color:color}));
                }

                if (obj.object == "rock") {
                    this.shapes.rock.draw(context, program_state, transform, this.materials.rock);
                }

                if (obj.object == "squid") {    
                    // animate squid            
                    let squid_movement = negorpos * (Math.sin(Math.PI * ts/4));    
                    transform = transform.times(Mat4.scale(2,1.5,2,0))
                                         .times(Mat4.translation(0,squid_movement,0))
                                         .times(Mat4.rotation(squid_movement,0,1,0))
                    this.shapes.squid.draw(context, program_state, transform,shadow_pass? this.materials.gold : this.pure);
                }

                if (obj.object == "starfish") {
                    transform = transform.times(Mat4.rotation(-45,1,0,0))
                                         .times(Mat4.scale(0.4,0.4,0.4,0))
                    this.shapes.starfish.draw(context, program_state, transform, this.materials.coral.override({color:color}));
                }

                if (obj.object == "shell") {
                    transform = transform.times(Mat4.scale(0.35,0.35,0.35,0))
                    this.shapes.seashell.draw(context, program_state, transform, this.materials.shelltexture);
                }

                if (obj.object == "jellyfish") {
                    // animate jellyfish 
                    let jelly_movement = negorpos * (Math.sin(Math.PI * ts/4));
                    let max_angle = .07 * Math.PI;
                    let jelly_stretch = (1 + (max_angle/2) * (Math.sin(Math.PI*(ts/1.2))));
                    transform = transform.times(Mat4.rotation(-33,1,0,0))
                                         .times(Mat4.rotation(-66,0,1,0))
                                         .times(Mat4.translation(0,0,jelly_movement,0))
                                         .times(Mat4.rotation(jelly_movement,0,0,1))
                                         .times(Mat4.scale(1,1,jelly_stretch,0))
                                         .times(Mat4.scale(0.8,0.8,0.8,0));
                    this.shapes.jellyfish.draw(context, program_state, transform,shadow_pass? this.materials.jellyfish.override({color:color}) : this.pure);
                }

                if (obj.object == "nest") {
                    // change positioning of eggs at different locations due to perspective projection 
                    if (position[0] < 0){
                        transform = transform.times(Mat4.scale(0.6,0.6,0.6,0));
                        this.shapes.nest.draw(context, program_state, transform, shadow_pass? this.materials.coral.override({color:hex_color("#7a5038")}) : this.pure);

                            let egg1 = transform.times(Mat4.scale(0.45,0.8,0.6,0))
                                                .times(Mat4.translation(-0.8,0,0.2,0));
                            this.shapes.sphere.draw(context, program_state, egg1, shadow_pass? this.materials.egg : this.pure);
                            let egg2 = transform.times(Mat4.scale(0.4,0.7,0.6,0))
                                                .times(Mat4.translation(-1.5,0,-0.5,0))
                                                .times(Mat4.rotation(-10,1,1,1));
                            this.shapes.sphere.draw(context, program_state, egg2, shadow_pass? this.materials.egg : this.pure);
                            let egg3 = transform.times(Mat4.scale(0.5,0.8,0.6,0))
                                                .times(Mat4.translation(0.4,0,-0.6,0))
                                                .times(Mat4.rotation(-10,1,1,1));
                            this.shapes.sphere.draw(context, program_state, egg3, shadow_pass? this.materials.egg : this.pure);
                            let egg4 = transform.times(Mat4.scale(0.5,0.4,0.6,0))
                                                .times(Mat4.translation(2,0.7,1,0))
                                                .times(Mat4.rotation(-10,1,1,1));
                            this.shapes.sphere.draw(context, program_state, egg4, shadow_pass? this.materials.egg : this.pure);  
                                         
                    }
                    
                    else if (position[0] > 0){
                        transform = transform.times(Mat4.scale(0.6,0.6,0.6,0));
                        this.shapes.nest.draw(context, program_state, transform, shadow_pass? this.materials.coral.override({color:hex_color("#7a5038")}) : this.pure);
                            let egg1 = transform.times(Mat4.scale(0.45,0.8,0.6,0))
                                                .times(Mat4.translation(-0.8,0,0.2,0));
                            this.shapes.sphere.draw(context, program_state, egg1, shadow_pass? this.materials.egg : this.pure);
                            let egg2 = transform.times(Mat4.scale(0.4,0.7,0.6,0))
                                                .times(Mat4.translation(-1.5,0,-0.5,0))
                                                .times(Mat4.rotation(-10,1,1,1));
                            this.shapes.sphere.draw(context, program_state, egg2, shadow_pass? this.materials.egg : this.pure);
                            let egg3 = transform.times(Mat4.scale(0.4,0.78,0.6,0))
                                                .times(Mat4.translation(0,0,-0.6,0))
                                                .times(Mat4.rotation(-10,1,1,1));
                            this.shapes.sphere.draw(context, program_state, egg3, shadow_pass? this.materials.egg : this.pure);
                            let egg4 = transform.times(Mat4.scale(0.5,0.4,0.6,0))
                                                .times(Mat4.translation(1,0.7,1,0))
                                                .times(Mat4.rotation(-10,1,1,1));
                            this.shapes.sphere.draw(context, program_state, egg4, shadow_pass? this.materials.egg : this.pure);                  
                    }

                }
            }
        }


        if(this.lifes == 0){
            let score_transform = Mat4.identity().times(Mat4.translation(7.5,18.5,4)).times(Mat4.scale(1.2,1.2,0.2,5));
            let total_score = this.total_spent;
            this.shapes.text.set_string(total_score.toString(), context.context);
            this.shapes.square.draw(context, program_state, score_transform.times(Mat4.scale(2.5, 2.5, .50)), this.materials.totalspent);
            score_transform = score_transform.times(Mat4.translation(2.5,0,0))
            this.shapes.square.draw(context, program_state, score_transform.times(Mat4.scale(.50, .50, .50)), this.materials.sanddollar);
            score_transform = score_transform.times(Mat4.translation(1.2,0,0));
            this.shapes.text.draw(context, program_state, score_transform.times(Mat4.scale(0.7, 0.7, .50)), this.materials.text_image);

            let game_over = Mat4.identity().times(Mat4.translation(-8.5,16,4,0))
                                           .times(Mat4.scale(1.2,1.2,0.2,5))
                                           .times(Mat4.translation(3,-2,1,0));
            this.shapes.square.draw(context, program_state, game_over.times(Mat4.scale(7, 7, 1)), this.materials.gameoverpic);
            let take_pix1 = Mat4.identity().times(Mat4.translation(-19,17.5,4)).times(Mat4.scale(1.2,1.2,0.2,5));
            this.shapes.square.draw(context, program_state, take_pix1.times(Mat4.scale(3.5, 3.5, .50)), this.materials.takepix);

             // draw three baby turtles at game over if nests were bought 
            for (let i = 0; i < this.nest_count; i++){
                
                let babyturtle1_transform = this.nest_location[i].times(Mat4.translation(-2.5,0,0))
                                                .times(Mat4.rotation(-33,0,1,0))
                                                .times(Mat4.scale(0.5,0.5,0.5,0));
                this.shapes.babyturtle.draw(context, program_state, babyturtle1_transform, this.materials.turtle.override({color: hex_color("#abeb91")}));

                let babyturtle2_transform = this.nest_location[i].times(Mat4.translation(2.5,0,0))
                                        .times(Mat4.rotation(33,0,1,0))
                                                .times(Mat4.scale(0.5,0.5,0.5,0));
                this.shapes.babyturtle.draw(context, program_state, babyturtle2_transform, this.materials.turtle.override({color: hex_color("#abeb91")}));

                let babyturtle3_transform = this.nest_location[i].times(Mat4.translation(4,0,0))
                                        .times(Mat4.rotation(-33,0,1,0))
                                                .times(Mat4.scale(0.5,0.5,0.5,0));
                this.shapes.babyturtle.draw(context, program_state, babyturtle3_transform, this.materials.turtle.override({color: hex_color("#abeb91")}));
            }

        }

    }

    make_control_panel() {

        // Start Game (enter key)
        this.key_triggered_button("Start", ['Enter'], () => {
            this.startgame =! this.startgame;

            // loop background audio
            if (typeof this.background_sound.loop == 'boolean')
            {
                this.background_sound.loop = true;
            }
            else
            {
                this.background_sound.addEventListener('ended', function() {
                    this.currentTime = 0;
                    this.play();
                }, false);
            }
            this.background_sound.play(); 
        });

        // ****** User Turtle Interactions ****** // 

        // Up Movement (arrow key up)
        this.key_triggered_button("Up", ['ArrowUp'], () => {
            if(this.y_movement < 37 && !(this.paused)){
                this.y_movement = this.y_movement + 1;
            }
        });
        // Down Movement (arrow key down)
        this.key_triggered_button("Down", ['ArrowDown'], () => {
            if(this.y_movement > -3 && !(this.paused)){
                this.y_movement = this.y_movement - 1; 
            }
        });
        
        // Left Movement (arrow key left)
        this.key_triggered_button("Left", ['ArrowLeft'], () => {
            if(this.x_movement  > -37 && !(this.paused))
            this.x_movement = this.x_movement - 1; 
        });

        // Right Movement (arrow key right)
        this.key_triggered_button("Right", ['ArrowRight'], () => {
            if(this.x_movement < 24 && !(this.paused)){
                this.x_movement = this.x_movement + 1;
            } 
        });
        
        // ******** Extra key triggered features ********* // 
       
        this.key_triggered_button("Change Lighting Color", ['c'], () => {
            this.change_lighting_color = true; 
        });
        this.key_triggered_button("Stop Music", ['s'], () => {
            // loop background audio
            this.background_sound.pause(); 
        });
        // Pause Game (p key)
        this.key_triggered_button("Pause", ['p'], () => {
            this.paused =! this.paused;
        });

    }

    set_fish_colors() {
        // Fill two array with 50 random colors, for fishies
        for (var i = 0; i < 50; i++) {
            this.fish_color_array[i] = color(Math.random(), Math.random(), Math.random(), 1.0);
        }
    }

    set_light_color() {
        // change lighting color to random color 
        this.light_color = color(Math.random(), Math.random(), Math.random(), 1.0);
    }

    /* When called, the following functions give new coordinates to a specefic */
    new_fish_cord_left(fish_count, t){
        this.x_spawn_left[fish_count] = Math.floor(Math.random() * (-150 +30) -30);
        this.y_spawn_left[fish_count] = Math.floor(Math.random() * 18);
        this.time_offsets_left[fish_count] = t;
    }

    new_fish_cord_right(fish_count,t){
        this.x_spawn_right[fish_count] = Math.floor(Math.random() * (100 - 30) + 30);
        this.y_spawn_right[fish_count] = Math.floor(Math.random() * 18);
        this.time_offsets_right[fish_count] = t;

    }

    new_shark_cord_left(shark_count, t){
        //spawn new coords ensuring not too close to each other
        var temp_x = Math.floor(Math.random() * (-150 +50) -50);
        while((this.x_shark_spawn_left).includes(temp_x) || (this.x_shark_spawn_left).includes((temp_x-1)) || 
              (this.x_shark_spawn_left).includes((temp_x+1)) || (this.x_shark_spawn_left).includes((temp_x-2)) || 
              (this.x_shark_spawn_left).includes((temp_x+2)) || (this.x_shark_spawn_left).includes((temp_x-3)) || 
              (this.x_shark_spawn_left).includes((temp_x+3)) || (this.x_shark_spawn_left).includes((temp_x-4)) || 
              (this.x_shark_spawn_left).includes((temp_x+4)) || (this.x_shark_spawn_left).includes((temp_x-5)) || 
              (this.x_shark_spawn_left).includes((temp_x+5)) || (this.x_shark_spawn_left).includes((temp_x-6)) || 
              (this.x_shark_spawn_left).includes((temp_x+6)) || (this.x_shark_spawn_left).includes((temp_x-7)) || 
              (this.x_shark_spawn_left).includes((temp_x+7))){
            temp_x = Math.floor(Math.random() * (-150 +50) -50);
        }
        this.x_shark_spawn_left[shark_count] = temp_x;
        var temp_y = Math.floor(Math.random() * 18);
        while((this.y_shark_spawn_left).includes(temp_y) || (this.y_shark_spawn_left).includes((temp_y-1)) || 
              (this.y_shark_spawn_left).includes((temp_y+1) || (this.y_shark_spawn_left).includes((temp_y-2)) || 
              (this.y_shark_spawn_left).includes((temp_y+2)))){
            temp_y = Math.floor(Math.random() * 18);
        }
        this.y_shark_spawn_left[shark_count] = temp_y;
        this.time_shark_offsets_left[shark_count] = t;

    }

    new_shark_cord_right(shark_count, t){
        //spawn new coords ensuring not too close to each other
        var temp_x = Math.floor(Math.random() * (150 - 50) + 50);
        while((this.x_shark_spawn_right).includes(temp_x) || (this.x_shark_spawn_right).includes((temp_x-1)) || 
              (this.x_shark_spawn_right).includes((temp_x+1)) || (this.x_shark_spawn_right).includes((temp_x-2)) || 
              (this.x_shark_spawn_right).includes((temp_x+2)) || (this.x_shark_spawn_right).includes((temp_x-3)) || 
              (this.x_shark_spawn_right).includes((temp_x+3)) || (this.x_shark_spawn_right).includes((temp_x-4)) || 
              (this.x_shark_spawn_right).includes((temp_x+4)) || (this.x_shark_spawn_right).includes((temp_x-5)) || 
              (this.x_shark_spawn_right).includes((temp_x+5)) || (this.x_shark_spawn_right).includes((temp_x-6)) || 
              (this.x_shark_spawn_right).includes((temp_x+6)) || (this.x_shark_spawn_right).includes((temp_x-7)) || 
              (this.x_shark_spawn_right).includes((temp_x+7))){
            temp_x = Math.floor(Math.random() * (150 - 50) + 50);
        }
        this.x_shark_spawn_right[shark_count] = temp_x;
        //this.x_shark_spawn_right[shark_count] = Math.floor(Math.random() * (150 - 50) + 50);
        var temp_y = Math.floor(Math.random() * 18);
        while((this.y_shark_spawn_right).includes(temp_y) || (this.y_shark_spawn_right).includes((temp_y-1)) || 
              (this.y_shark_spawn_right).includes((temp_y+1)) || (this.y_shark_spawn_right).includes((temp_y-2)) || 
              (this.y_shark_spawn_right).includes((temp_y+2))){
            temp_y = Math.floor(Math.random() * 18);
        }
        this.y_shark_spawn_right[shark_count] = temp_y;        
        this.time_shark_offsets_right[shark_count] = t;

    }

    /* Draws fishes coming from left*/
    draw_fishes_left(context, program_state, model_transform, fish_count, t, speed, shadow_pass) { 
            let fish_color = this.fish_color_array[fish_count];
            var x_cord = this.x_spawn_left[fish_count];
            var y_cord = this.y_spawn_left[fish_count];
        /* Checks if current x-coord is offscreen, if its not it just keeps swimming :) */
        if(x_cord+((t-this.time_offsets_left[fish_count])*speed) < 25){             
            let fish_trans = model_transform.times(Mat4.translation(x_cord, y_cord, 0, 0))
                                              .times(Mat4.translation((t-this.time_offsets_left[fish_count])*speed,0,0,0))
                                              .times(Mat4.scale(0.8,0.6,0.5,1));
      
            this.shapes.fishbody.draw(context, program_state, fish_trans, shadow_pass? this.materials.guppies.override({color:fish_color}) : this.pure);

            let max_angle = .1 * Math.PI;
            let tail_rot = ((max_angle/2) + (max_angle/2) * (Math.sin(Math.PI*(t*4))));

            let tail_trans = model_transform.times(Mat4.translation(x_cord-0.5, y_cord, 0, 0))
                                             .times(Mat4.translation((t-this.time_offsets_left[fish_count])*speed,0,0,0))
                                             .times(Mat4.scale(1,1,1,1))
                                             .times(Mat4.rotation(-73,0,0,1))
                                             .times(Mat4.rotation(tail_rot,0,1,0));
            this.shapes.tail.draw(context, program_state, tail_trans, shadow_pass? this.materials.tails.override({color:fish_color}) : this.pure);
        /* If fish off screen, we update it the time offset since we use time to translate in above bracket
           Also updated coordinates so it looks more random
        */
        } else{
            this.new_fish_cord_left(fish_count, t);
        }
    }
    

    /* Draws fishes coming from right */    
    draw_fishes_right(context, program_state, model_transform, fish_count, t, speed, shadow_pass){
        let fish_color = this.fish_color_array[fish_count * 5];
        var fish = [];
        var x_cord = this.x_spawn_right[fish_count];
        var y_cord = this.y_spawn_right[fish_count];
        /* Checks if current x-coord is offscreen, if its not it just keeps swimming :) */
        if(x_cord-((t-this.time_offsets_right[fish_count])*speed) > -35){
            let fish_trans = model_transform.times(Mat4.translation(x_cord, y_cord, 0, 0))
                                              .times(Mat4.translation(-(t-this.time_offsets_right[fish_count])*speed,0,0,0))
                                              .times(Mat4.scale(0.8,0.6,0.5,1));
      
            this.shapes.fishbody.draw(context, program_state, fish_trans,shadow_pass? this.materials.guppies.override({color:fish_color}) : this.pure);

            let max_angle = .1 * Math.PI;
            let tail_rot = ((max_angle/2) + (max_angle/2) * (Math.sin(Math.PI*(t*4))));

            let tail_trans = model_transform.times(Mat4.translation(x_cord+0.5, y_cord, 0, 0))
                                             .times(Mat4.translation(-(t-this.time_offsets_right[fish_count])*speed,0,0,0))
                                             .times(Mat4.scale(1,1,1,1))
                                             .times(Mat4.rotation(74.61,0,0,1))
                                             .times(Mat4.rotation(-tail_rot,0,1,0));
            this.shapes.tail.draw(context, program_state, tail_trans,shadow_pass? this.materials.tails.override({color:fish_color}) : this.pure);
        /* If fish off screen, we update it the time offset since we use time to translate in above bracket
           Also updated coordinates so it looks more random
        */
        }else{
            this.new_fish_cord_right(fish_count, t);
        }
        
    }
    draw_shark_left(context, program_state, model_transform, shark_count, t, speed, shadow_pass){
        var x_cord = this.x_shark_spawn_left[shark_count];
        var y_cord = this.y_shark_spawn_left[shark_count];
        
        /* Checks if current x-coord is offscreen, if its not it just keeps swimming :) */

        if(x_cord+((t-this.time_shark_offsets_left[shark_count])*speed) < 25){
            let shark_transform = model_transform.times(Mat4.translation(x_cord, y_cord, 0, 0))
                                             .times(Mat4.translation((t-this.time_shark_offsets_left[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(3,1.5,1,1));
            this.shapes.sharkbody.draw(context, program_state, shark_transform, shadow_pass? this.materials.shark : this.pure);

            let eye_transform = model_transform.times(Mat4.translation(x_cord+2, y_cord, 0.8, 0))
                                             .times(Mat4.translation((t-this.time_shark_offsets_left[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(0.1,0.1,0.1,1));
            if(this.lifes == 3){
                this.shapes.fishbody.draw(context, program_state, eye_transform, shadow_pass? this.materials.eye : this.pure);
            }else if(this.lifes == 2){
                this.shapes.fishbody.draw(context, program_state, eye_transform.times(Mat4.scale(1.5,1.5,0.5,0)).times(Mat4.translation(0,0,-2,0)), shadow_pass? this.materials.eye.override({color:hex_color("#FF0000")}) : this.pure);
            }else{
                this.shapes.fishbody.draw(context, program_state, eye_transform.times(Mat4.scale(2.5,2.5,1,0)).times(Mat4.translation(0,0,-2.2,0)), shadow_pass? this.materials.eye.override({color:hex_color("#FF0000")}) : this.pure);
                this.shapes.tail.draw(context, program_state, eye_transform.times(Mat4.scale(10,10,3,0)).times(Mat4.translation(0.6,-0.10,-3,0)).times(Mat4.rotation(Math.PI+0.05, 0,0,1)), shadow_pass? this.materials.shark.override({color:hex_color("#FFFFFF")}) : this.pure);
                this.shapes.tail.draw(context, program_state, eye_transform.times(Mat4.scale(10,10,3,0)).times(Mat4.translation(0.1,-0.10,-2.0,0)).times(Mat4.rotation(Math.PI+0.20, 0,0,1)), shadow_pass? this.materials.shark.override({color:hex_color("#FFFFFF")}) : this.pure);

            }

            let tails_transform = model_transform.times(Mat4.translation(x_cord-3, y_cord, 0, 0))
                                             .times(Mat4.translation((t-this.time_shark_offsets_left[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(2,1.5,1,1))
                                             .times(Mat4.rotation(-74.7,0,0,1));
            this.shapes.tail.draw(context, program_state, tails_transform, shadow_pass? this.materials.shark : this.pure);

            let tails2_transform = model_transform.times(Mat4.translation(x_cord-3, y_cord, 0, 0))
                                             .times(Mat4.translation((t-this.time_shark_offsets_left[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(2,1.5,1,1))
                                             .times(Mat4.rotation(-27.4,0,0,1));
            this.shapes.tail.draw(context, program_state, tails2_transform, shadow_pass? this.materials.shark : this.pure);

            let fin_transform = model_transform.times(Mat4.translation(x_cord-0.5, y_cord+1.2, 0, 0))
                                             .times(Mat4.translation((t-this.time_shark_offsets_left[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(2,1.5,1,1))
                                             .times(Mat4.rotation(-145,0,0,1));
            this.shapes.tail.draw(context, program_state, fin_transform, shadow_pass? this.materials.shark : this.pure);

        /* 
           If shark off screen, we update it the time offset since we use time to translate in above above bracket
           Also updated coordinates so it looks more random
        */
        }else{
            this.new_shark_cord_left(shark_count, t);
        }

    }

    draw_shark_right(context, program_state, model_transform, shark_count, t, speed, shadow_pass){
        var x_cord = this.x_shark_spawn_right[shark_count];
        var y_cord = this.y_shark_spawn_right[shark_count];
        
        /* Checks if current x-coord is offscreen, if its not it just keeps swimming :) */
        if(x_cord-((t-this.time_shark_offsets_right[shark_count])*speed) > -35){
            let shark_transform = model_transform.times(Mat4.translation(x_cord, y_cord, 0, 0))
                                             .times(Mat4.translation(-(t-this.time_shark_offsets_right[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(3,1.5,1,1));
            this.shapes.sharkbody.draw(context, program_state, shark_transform,shadow_pass? this.materials.shark : this.pure);

            let eye_transform = model_transform.times(Mat4.translation(x_cord-2, y_cord, 0.8, 0))
                                             .times(Mat4.translation(-(t-this.time_shark_offsets_right[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(0.1,0.1,0.1,1));
            if(this.lifes == 3){
                this.shapes.fishbody.draw(context, program_state, eye_transform, shadow_pass? this.materials.eye : this.pure);
            }else if(this.lifes == 2){
                this.shapes.fishbody.draw(context, program_state, eye_transform.times(Mat4.scale(1.5,1.5,0.5,0)).times(Mat4.translation(0,0,-2,0)), shadow_pass? this.materials.eye.override({color:hex_color("#FF0000")}) : this.pure);
            }else{
                this.shapes.fishbody.draw(context, program_state, eye_transform.times(Mat4.scale(2.5,2.5,1,0)).times(Mat4.translation(0,0,-2.2,0)), shadow_pass? this.materials.eye.override({color:hex_color("#FF0000")}) : this.pure);
                this.shapes.tail.draw(context, program_state, eye_transform.times(Mat4.scale(10,10,3,0)).times(Mat4.translation(-0.45,-0.2,-2.0,0)).times(Mat4.rotation(Math.PI+1.80, 0,0,1)), shadow_pass? this.materials.shark.override({color:hex_color("#FFFFFF")}) : this.pure);
                this.shapes.tail.draw(context, program_state, eye_transform.times(Mat4.scale(10,10,3,0)).times(Mat4.translation(-0.35,-0.095,-3.0,0)).times(Mat4.rotation(Math.PI+1.30, 0,0,1)), shadow_pass? this.materials.shark.override({color:hex_color("#FFFFFF")}) : this.pure);

            }
            let tails_transform = model_transform.times(Mat4.translation(x_cord+3.03, y_cord, 0, 0))
                                             .times(Mat4.translation(-(t-this.time_shark_offsets_right[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(2,1.5,1,1))
                                             .times(Mat4.rotation(20,0,0,1));
            this.shapes.tail.draw(context, program_state, tails_transform,shadow_pass? this.materials.shark : this.pure);

            let tails2_transform = model_transform.times(Mat4.translation(x_cord+3.03, y_cord, 0, 0))
                                             .times(Mat4.translation(-(t-this.time_shark_offsets_right[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(2,1.5,1,1))
                                             .times(Mat4.rotation(60,0,0,1));
            this.shapes.tail.draw(context, program_state, tails2_transform,shadow_pass? this.materials.shark : this.pure);

            let fin_transform = model_transform.times(Mat4.translation(x_cord-0.5, y_cord+1.3, 0, 0))
                                             .times(Mat4.translation(-(t-this.time_shark_offsets_right[shark_count])*speed,0,0,0))
                                             .times(Mat4.scale(2,1.5,1,1))
                                             .times(Mat4.rotation(-145,0,0,1));
            this.shapes.tail.draw(context, program_state, fin_transform,shadow_pass? this.materials.shark : this.pure);

        /* 
           If shark off screen, we update it the time offset since we use time to translate in above above bracket
           Also updated coordinates so it looks more random
        */
        }else{
            this.new_shark_cord_right(shark_count, t);
        }

    }

    /* Called when collision is detected with fish, scales turtle bigger */
    collision_scale(){
        this.turtle_body_global = this.turtle_body_global.times(Mat4.scale(1.015,1.015,1,0));
        this.turtle_head_global = this.turtle_head_global.times(Mat4.scale(1.015,1.015,1.015,0))
                                                         .times(Mat4.translation(0,0.025,0));
        

        this.turtle_larm_global = this.turtle_larm_global.times(Mat4.scale(1.015,1.015,1.015,0))
                                                         .times(Mat4.translation(-0.025,0.025,0));
    
        this.turtle_rarm_global = this.turtle_rarm_global.times(Mat4.scale(1.015,1.015,1.015,0))
                                                         .times(Mat4.translation(0.025,0.025,0));
        
        this.turtle_lleg_global = this.turtle_lleg_global.times(Mat4.scale(1.015,1.015,1.015,0))
                                                         .times(Mat4.translation(-0.025,-0.025,0));
        
        this.turtle_rleg_global = this.turtle_rleg_global.times(Mat4.scale(1.015,1.015,1.015,0))
                                                         .times(Mat4.translation(0.025,-0.025,0));
        //used for collision detection sensitivity
        this.collision_count = this.collision_count + 1;
    }


    
    detect_fish_collision_left(fish_count, t, speed){
        /* Gets current fishes coordinates with respect to time */
        let fish_x_cord = this.x_spawn_left[fish_count] + ((t-this.time_offsets_left[fish_count])*speed);
        let fish_y_cord = this.y_spawn_left[fish_count];
        let turtle_x = this.x_movement;
        let turtle_y = this.y_movement;
        /*Gets turtle and fishes coordinates on the same scale */
        //turtle_x bounds on screen: [-36, 23] turtle_y bounds: [-6.5, 49] 
        //fish_x_cord bounds ons creen [-27,17] fish_y_cord bounds [-3.5 ,22]
        //fish_x_cord converted to turtle_x coords using equation: Turtle-X_cord = fish_x_cord(59/44) - 9/44
        //fish_x_cord converted to turtle_x coords using equation: Turtle-Y_cord = fish_y_cord(59/44) - 9/44
        let fish_to_turtle_x = fish_x_cord*(59/44) - 9/44;
        let fish_to_turtle_y = fish_y_cord*(37/17) + 19/17;
        if((Math.abs(fish_to_turtle_x - turtle_x) < 2 + this.collision_count*0.05) && (Math.abs(fish_to_turtle_y - this.y_movement) < 3.2 + this.collision_count*0.075)){
            this.munch_sound.play();
            this.new_fish_cord_left(fish_count, t);
            this.collision_scale();
            this.sand_dollars = this.sand_dollars + 2;         
        }
    }

    detect_fish_collision_right(fish_count, t, speed){
        /* Gets current fishes coordinates with respect to time */
        let fish_x_cord = this.x_spawn_right[fish_count] - ((t-this.time_offsets_right[fish_count])*speed);
        let fish_y_cord = this.y_spawn_right[fish_count];
        let turtle_x = this.x_movement;
        let turtle_y = this.y_movement;
        /*Gets turtle and fishes coordinates on the same scale */
        let fish_to_turtle_x = fish_x_cord*(59/44) - 9/44;
        let fish_to_turtle_y = fish_y_cord*(37/17) + 19/17;
        if((Math.abs(fish_to_turtle_x - turtle_x) < 2 + this.collision_count*0.05) && (Math.abs(fish_to_turtle_y - this.y_movement) < 3.2 + this.collision_count*0.075)){
            this.munch_sound.play();
            this.new_fish_cord_right(fish_count,t);
            this.collision_scale();
            this.sand_dollars = this.sand_dollars + 2; 
        }
    }

    detect_shark_collision_left(shark_count, t, speed){
        /* Gets current shark coordinates with respect to time */
        let shark_x_cord = this.x_shark_spawn_left[shark_count] + ((t-this.time_shark_offsets_left[shark_count])*speed);
        let shark_y_cord = this.y_shark_spawn_left[shark_count];
        let turtle_x = this.x_movement;
        let turtle_y = this.y_movement;
        
        /*Gets turtle and shark coordinates on the same scale */
        let shark_to_turtle_x = shark_x_cord*(59/44) - 9/44;
        let shark_to_turtle_y = shark_y_cord*(37/17) + 19/17;
        if((Math.abs(shark_to_turtle_x - turtle_x) < 6 + this.collision_count*0.005) && (Math.abs(shark_to_turtle_y - this.y_movement) < 5.5 + this.collision_count*0.005))
        {
            this.shark_sound.play();

            for(let i = 0; i < this.left_shark_count; i++){        
                this.new_shark_cord_left(i, t);
            }
            for(let i = 0; i < this.right_shark_count; i++){
                this.new_shark_cord_right(i, t);
            }

            this.lifes = this.lifes - 1;
        }
    }

  detect_shark_collision_right(shark_count, t, speed){
        /* Gets current shark coordinates with respect to time */
        let shark_x_cord = this.x_shark_spawn_right[shark_count] - ((t-this.time_shark_offsets_right[shark_count])*speed);
        let shark_y_cord = this.y_shark_spawn_right[shark_count];
        let turtle_x = this.x_movement;
        let turtle_y = this.y_movement;
        /*Gets turtle and shark coordinates on the same scale */
        let shark_to_turtle_x = shark_x_cord*(59/44) - 9/44;
        let shark_to_turtle_y = shark_y_cord*(37/17) + 19/17;
        if((Math.abs(shark_to_turtle_x - turtle_x) < 6 + this.collision_count*0.005) && (Math.abs(shark_to_turtle_y - this.y_movement) < 5.5 + this.collision_count*0.005))
        {

            this.shark_sound.play();

            for(let i = 0; i < this.left_shark_count; i++){
                this.new_shark_cord_left(i, t);
            }
            for(let i = 0; i < this.right_shark_count; i++){
                this.new_shark_cord_right(i, t);
            }

            this.lifes = this.lifes - 1;

        }
    }

    // when user clicks --> check if they are able to purchase & place an item 
    mouse_draw_obj(context, program_state) {
        // no button clicks? return 
        if (this.userdraw == "none"){
            return;
        }
        // else, create object & push to item queue 
        else {
            let obj_color = color(Math.random(), Math.random(), Math.random(), 1.0);
            let obj_scale = Math.random() * (3 - 1) + 1;
            let negorpos = 1 - 2 * Math.round(Math.random());
            let obj_rot = negorpos * Math.random() * (4 - 2) + 2;
            
            // since aquarium sphere is only so big --> set far z-axis to be closer/more forward  
            let z_coord = 0.97;
            
            // if mouse click / object placement is on sand --> set far z-axis to more forward so object doesn't hide behind sand
            if (this.mousey < -0.5)
            {
                z_coord = 0.95;
            }
            
            let pos_ndc_near = vec4(this.mousex, this.mousey, -1.0, 1.0);
            let pos_ndc_far  = vec4(this.mousex, this.mousey, z_coord, 1.0);
            let center_ndc_near = vec4(0.0, 0.0, -1.0, 1.0);
            let P = program_state.projection_transform;
            let V = program_state.camera_inverse;
            let pos_world_near = Mat4.inverse(P.times(V)).times(pos_ndc_near);
            let pos_world_far  = Mat4.inverse(P.times(V)).times(pos_ndc_far);
            let center_world_near  = Mat4.inverse(P.times(V)).times(center_ndc_near);
            pos_world_near.scale_by(1 / pos_world_near[3]);
            pos_world_far.scale_by(1 / pos_world_far[3]);
            center_world_near.scale_by(1 / center_world_near[3]);

            // create object 
            let obj = {
                pos: pos_world_far,
                color: obj_color,
                size: obj_scale,
                negorpos: negorpos,
                object: this.userdraw
            }

            // if user clicked on nest --> update nest count & push position to queue 
            // in order to hatch corresponding baby turtles at game over 
            if (this.userdraw == "nest"){
                this.nest_count += 1;
                let transform = Mat4.translation(pos_world_far[0], pos_world_far[1], pos_world_far[2])
                                    .times(Mat4.scale(obj_scale, obj_scale, obj_scale, 0));
                this.nest_location.push(transform.times(Mat4.scale(0.6,0.6,0.6,0)));
            }

            this.userdraw = "none";

            // update sand dollars & total spent amount
            this.sand_dollars = this.sand_dollars - this.offset;
            this.total_spent = this.total_spent + this.offset;
            this.offset = 0;
             
            // push object to queue 
            this.item_queue.push(obj); 
        }
    }

    // draws interactive menu bar with clickable buttons 
    draw_menu_bar(context, program_state, model_transform, t){
        // draw menu platform at top of viewport (wood texture)
        let menubar_trans = model_transform.times(Mat4.translation(-26.4, 21, 0, 0))
                                                      .times(Mat4.scale(50, 2, 0, 0))
        this.shapes.square.draw(context, program_state, menubar_trans, this.materials.menu);

        // draw item 1: floral coral
        var item1_background_trans = model_transform.times(Mat4.translation(-23.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item1_trans = item1_background_trans.times(Mat4.translation(0.5, -0.25, 2, 0))
                                                .times(Mat4.scale(0.38, 0.38, 1, 0))
                                                .times(Mat4.rotation(-43.7, 0, 0, 1));
        this.shapes.coral1.draw(context, program_state, item1_trans, this.materials.coral.override({color:hex_color("#e691bc")}));

        let item1_price_trans = model_transform.times(Mat4.translation(-26.1, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price1 = 2;
        this.shapes.text.set_string("$"+ price1.toString(), context.context);
        this.shapes.text.draw(context, program_state, item1_price_trans, this.materials.text_image);
        
        // get position of item 1 button
        let button1x = ((item1_background_trans[0][3]) - (-5)) / 22.5;
        let button1y = (item1_background_trans[1][3] - (10.5)) / 12; 

        // check if mouse click on item 1 button
        if ((this.mousex < button1x + 0.1 && this.mousex > button1x - 0.1) && (this.mousey < button1y + 0.12 && this.mousey > button1y - 0.1) && (this.sand_dollars - price1 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item1_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            
            // draw item on next mouse click          
            this.userdraw = "coral1";
            this.offset = price1;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item1_background_trans, this.materials.menubuttons);
        }

        // draw item 2: rock 
        let item2_background_trans = model_transform.times(Mat4.translation(-18.3, 20.8, 0, 0))
                                        .times(Mat4.scale(1.4, 1.4, .5, 0))

        let item2_trans = item2_background_trans.times(Mat4.translation(0.3, -0.25, 2, 0))
                                                .times(Mat4.scale(0.65, 0.65, 1, 0));
        this.shapes.rock.draw(context, program_state, item2_trans, this.materials.rock);

        let item2_price_trans = model_transform.times(Mat4.translation(-21, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price2 = 1;
        this.shapes.text.set_string("$"+ price2.toString(), context.context);
        this.shapes.text.draw(context, program_state, item2_price_trans, this.materials.text_image);
        

        // get position of item 2 button 
        let button2x = ((item2_background_trans[0][3]) - (-5)) / 22.5;
        let button2y = (item2_background_trans[1][3] - (10.5)) / 12; 

        // check if item 2 button is clicked 
        if ((this.mousex < button2x + 0.1 && this.mousex > button2x - 0.1) && (this.mousey < button2y + 0.12 && this.mousey > button2y - 0.1) && (this.sand_dollars - price2 >= 0))
        {
            var new_money = this.sand_dollars - price2;
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item2_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            // draw item on next mouse click          
            this.userdraw = "rock";
            this.offset = price2;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item2_background_trans, this.materials.menubuttons);
        }


        // draw item 3: spiky coral
        let item3_background_trans = model_transform.times(Mat4.translation(-13, 20.8, 0, 0))
                                                        .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item3_trans = item3_background_trans.times(Mat4.translation(0.2, -0.25, 2, 0))
                                                    .times(Mat4.scale(0.5, 0.47, 1, 0));
        this.shapes.coral2.draw(context, program_state, item3_trans, this.materials.coral.override({color: hex_color("#f59f49")}));

        let item3_price_trans = model_transform.times(Mat4.translation(-16, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price3 = 3;
        this.shapes.text.set_string("$"+ price3.toString(), context.context);
        this.shapes.text.draw(context, program_state, item3_price_trans, this.materials.text_image);
        
        // get position of item 3 button 
        let button3x = ((item3_background_trans[0][3]) - (-5)) / 22.5;
        let button3y = (item3_background_trans[1][3] - (10.5)) / 12; 

        // check if item 3 button is clicked 
        if ((this.mousex < button3x + 0.1 && this.mousex > button3x - 0.1) && (this.mousey < button3y + 0.12 && this.mousey > button3y - 0.1) && (this.sand_dollars - price3 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item3_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            // draw item on next mouse click          
            this.userdraw = "coral2";
            this.offset = price3;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item3_background_trans, this.materials.menubuttons);
        }

        // draw item 4: golden squid  
        let item4_background_trans = model_transform.times(Mat4.translation(-6.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item4_trans = item4_background_trans.times(Mat4.translation(0.1, -0.25, 2, 0))
                                                .times(Mat4.scale(.7, .33, 1, 0))
        this.shapes.squid.draw(context, program_state, item4_trans, this.materials.gold);

        let item4_price_trans = model_transform.times(Mat4.translation(-10.8, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price4 = 15;
        this.shapes.text.set_string("$"+ price4.toString(), context.context);
        this.shapes.text.draw(context, program_state, item4_price_trans, this.materials.text_image);
        

        // get position of item 4 button
        let button4x = ((item4_background_trans[0][3]) - (-5)) / 22.5;
        let button4y = (item4_background_trans[1][3] - (10.5)) / 12; 

        // check if item 4 button is clicked 
        if ((this.mousex < button4x + 0.1 && this.mousex > button4x - 0.1) && (this.mousey < button4y + 0.12 && this.mousey > button4y - 0.1) && (this.sand_dollars - price4 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item4_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            // draw item on next mouse click          
            this.userdraw = "squid";
            this.offset = price4;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item4_background_trans, this.materials.menubuttons);
        }

        // draw item 5: starfish  
        let item5_background_trans = model_transform.times(Mat4.translation(-1.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item5_trans = item5_background_trans.times(Mat4.translation(-0.1, -0.25, 2, 0))
                                                .times(Mat4.scale(.5, .5, 1, 0))
        this.shapes.starfish.draw(context, program_state, item5_trans, this.materials.coral.override({color: hex_color("#ff892e")}));

        let item5_price_trans = model_transform.times(Mat4.translation(-4.7, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price5 = 5;
        this.shapes.text.set_string("$"+ price5.toString(), context.context);
        this.shapes.text.draw(context, program_state, item5_price_trans, this.materials.text_image);

        // get position of item 5 button
        let button5x = ((item5_background_trans[0][3]) - (-5)) / 22.5;
        let button5y = (item5_background_trans[1][3] - (10.5)) / 12; 

        // check if item 5 button is clicked 
        if ((this.mousex < button5x + 0.1 && this.mousex > button5x - 0.1) && (this.mousey < button5y + 0.12 && this.mousey > button5y - 0.1) && (this.sand_dollars - price5 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item5_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            // draw item on next mouse click          
            this.userdraw = "starfish";
            this.offset = price5;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item5_background_trans, this.materials.menubuttons);
        }
        // draw item 6: seashell  
        let item6_background_trans = model_transform.times(Mat4.translation(4, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item6_trans = item6_background_trans.times(Mat4.translation(0.2, -0.25, 2, 0))
                                                .times(Mat4.scale(.4, .4, 1, 0))
        this.shapes.seashell.draw(context, program_state, item6_trans, this.materials.coral.override({color: hex_color("#f5988e")}));

        let item6_price_trans = model_transform.times(Mat4.translation(0.3, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price6 = 4;
        this.shapes.text.set_string("$"+ price6.toString(), context.context);
        this.shapes.text.draw(context, program_state, item6_price_trans, this.materials.text_image);

        // get position of item 6 button
        let button6x = ((item6_background_trans[0][3]) - (-5)) / 22.5;
        let button6y = (item6_background_trans[1][3] - (10.5)) / 12; 

        // check if item 6 button is clicked 
        if ((this.mousex < button6x + 0.1 && this.mousex > button6x - 0.1) && (this.mousey < button6y + 0.12 && this.mousey > button6y - 0.1) && (this.sand_dollars - price6 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item6_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            // draw item on next mouse click          
            this.userdraw = "shell";
            this.offset = price6;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item6_background_trans, this.materials.menubuttons);
        }

        // draw item 7: jellyfish  
        let item7_background_trans = model_transform.times(Mat4.translation(9.2, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item7_trans = item7_background_trans.times(Mat4.translation(-.35, -0.4, 2, 0))
                                                .times(Mat4.scale(.4, .35, 1, 0))
                                                .times(Mat4.rotation(-33, 1, 0, 0))
                                                .times(Mat4.rotation(-66, 0, 1, 0));
        this.shapes.jellyfish.draw(context, program_state, item7_trans, this.materials.coral.override({color: hex_color("#6ee7f0")}));

        let item7_price_trans = model_transform.times(Mat4.translation(5.7, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price7 = 7;
        this.shapes.text.set_string("$"+ price7.toString(), context.context);
        this.shapes.text.draw(context, program_state, item7_price_trans, this.materials.text_image);

        // get position of item 7 button
        let button7x = ((item7_background_trans[0][3]) - (-5)) / 22.5;
        let button7y = (item7_background_trans[1][3] - (10.5)) / 12; 

        // check if item 7 button is clicked 
        if ((this.mousex < button7x + 0.1 && this.mousex > button7x - 0.1) && (this.mousey < button7y + 0.12 && this.mousey > button7y - 0.1) && (this.sand_dollars - price7 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item7_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);  
            // draw item on next mouse click_scale          
            this.userdraw = "jellyfish";
            this.offset = price7;       
        }
        else {
            this.shapes.sphere.draw(context, program_state, item7_background_trans, this.materials.menubuttons);
        }

        // draw item 8: nest  
        let item8_background_trans = model_transform.times(Mat4.translation(15.5, 20.8, 0, 0))
                                                    .times(Mat4.scale(1.4, 1.4, .5, 0));

        let item8_trans = item8_background_trans.times(Mat4.translation(-.35, -0.1, 2, 0))
                                                .times(Mat4.scale(0.6, 0.6, 0.6, 0));
        this.shapes.nest.draw(context, program_state, item8_trans, this.materials.coral.override({color:hex_color("#7a5038")}));

        let egg1 = item8_trans.times(Mat4.scale(0.45,0.75,0.6,0))
                            .times(Mat4.translation(-0.8,0.2,0,0));
        this.shapes.sphere.draw(context, program_state, egg1, this.materials.egg);
        let egg2 = item8_trans.times(Mat4.scale(0.4,0.7,0.6,0))
                            .times(Mat4.translation(-1.5,0,-0.5,0))
                            .times(Mat4.rotation(-10,1,1,1));
        this.shapes.sphere.draw(context, program_state, egg2, this.materials.egg);
        let egg3 = item8_trans.times(Mat4.scale(0.4,0.78,0.6,0))
                            .times(Mat4.translation(0,0,-0.6,0))
                            .times(Mat4.rotation(-10,1,1,1));
        this.shapes.sphere.draw(context, program_state, egg3, this.materials.egg);
        let egg4 = item8_trans.times(Mat4.scale(0.5,0.4,0.6,0))
                            .times(Mat4.translation(1,0.7,1,0))
                            .times(Mat4.rotation(-10,1,1,1));
        this.shapes.sphere.draw(context, program_state, egg4, this.materials.egg);

        let item8_price_trans = model_transform.times(Mat4.translation(10.5, 20.3, 1, 0))
                                               .times(Mat4.scale(0.75, 0.75, 1, 0))
        var price8 = 12;
        this.shapes.text.set_string("$"+ price8.toString(), context.context);
        this.shapes.text.draw(context, program_state, item8_price_trans, this.materials.text_image);

        // get position of item 8 button
        let button8x = ((item8_background_trans[0][3]) - (-5)) / 22.5;
        let button8y = (item8_background_trans[1][3] - (10.5)) / 12; 

        // check if item 8 button is clicked 
        if ((this.mousex < button8x + 0.1 && this.mousex > button8x - 0.1) && (this.mousey < button8y + 0.12 && this.mousey > button8y - 0.1) && (this.sand_dollars - price8 >= 0))
        {
            // if clicked --> animate item so that we know it is clicked
            let click_animate = (t/6) % 0.08; 
            let animate_click_transform = item8_background_trans.times(Mat4.scale(1 + click_animate, 1 + click_animate, 1, 0));
            this.shapes.sphere.draw(context, program_state, animate_click_transform, this.materials.menubuttons);
            // draw item on next mouse click          
            this.userdraw = "nest";
            this.offset = price8;
        }
        else {
            this.shapes.sphere.draw(context, program_state, item8_background_trans, this.materials.menubuttons);
        }

        // draw money count
        let dash_model = Mat4.identity().times(Mat4.translation(11.2,16.8,4,0)).times(Mat4.scale(1.3,1.3,0.2,5));
        let point_string = this.sand_dollars;
        this.shapes.text.set_string(point_string.toString(), context.context);
        this.shapes.square.draw(context, program_state, dash_model.times(Mat4.scale(.50, .50, .50)), this.materials.sanddollar);
        dash_model = dash_model.times(Mat4.translation(1,-0.09,0));
        this.shapes.text.draw(context, program_state, dash_model.times(Mat4.scale(.50, .50, .50)), this.materials.text_image);

        
        // draw lifes count
        let lifes_model = Mat4.identity().times(Mat4.translation(-21.5,16,4,0)).times(Mat4.scale(1.2,1.2,0.2,5));
        let lifes_string = this.lifes;
        this.shapes.text.set_string("lives:", context.context);
        this.shapes.square.draw(context, program_state, lifes_model.times(Mat4.scale(2, 2, .50)), this.materials.livestext);
        for (var i = 0; i < this.lifes; i++){
            if (i == 0){
                var heart_model = lifes_model.times(Mat4.translation(2.7, 0.55, 0));
            }
            else{
                var heart_model = lifes_model.times(Mat4.translation(i*1.5+2.7, 0.55, 0));
            }
            this.shapes.square.draw(context, program_state, heart_model.times(Mat4.scale(0.7, 0.7, 1)), this.materials.heart);
        }
        
    }

    display(context, program_state) {                                 
    // display():  draw scene
        const gl = context.context;
        let model_transform = Mat4.identity();

       
        if (!this.init_ok) {
            const ext = gl.getExtension('WEBGL_depth_texture');
            if (!ext) {
                return alert('need WEBGL_depth_texture');  // eslint-disable-line
            }
            this.texture_buffer_init(gl);

            this.init_ok = true;
        }

        // set lights
        this.light_position = vec4(-5, 20, 5, 1);
        program_state.lights = [new Light(this.light_position, this.light_color, 1000)];

        // pov of light
        this.light_view_target = vec4(0, 0, 0, 1);
        this.light_field_of_view = 130 * Math.PI / 180; // 130 degree     
           
        // allow player to change lighting color
        if (this.change_lighting_color){
            this.set_light_color();
            this.change_lighting_color = false;
        }

        // set camera 
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());
            // Define the global camera and projection matrices, which are stored in program_state.
            program_state.set_camera(this.initial_camera_position);
        }
        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        // Shadows
        // set the perspective and camera to the POV of light
        const light_view_mat = Mat4.look_at(
            vec3(this.light_position[0], this.light_position[1], this.light_position[2]),
            vec3(this.light_view_target[0], this.light_view_target[1], this.light_view_target[2]),
            vec3(0, 1, 0), // assume the light to target will have a up dir of +y, maybe need to change according to your case
        );
        const light_proj_mat = Mat4.perspective(this.light_field_of_view, 1, 0.5, 500);
        // Bind the Depth Texture Buffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.lightDepthFramebuffer);
        gl.viewport(0, 0, this.lightDepthTextureSize, this.lightDepthTextureSize);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        // Prepare uniforms
        program_state.light_view_mat = light_view_mat;
        program_state.light_proj_mat = light_proj_mat;
        program_state.light_tex_mat = light_proj_mat;
        program_state.view_mat = light_view_mat;
        program_state.projection_transform = light_proj_mat;
        this.render_scene(context, program_state, false,false, false);

        // Step 2: unbind, draw to the canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        program_state.view_mat = program_state.camera_inverse;
        program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 0.5, 500);
        this.render_scene(context, program_state, true,true, true);
        
        // get ready for mouse picking/detection
        // mouse position
        let canvas = context.canvas;
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
                vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                    (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

        // when user clicks --> draw object at mouse position (if they can afford it)
        canvas.addEventListener("mousedown", e => {
            e.preventDefault();
            const rect = canvas.getBoundingClientRect()
            this.mousex = mouse_position(e)[0];
            this.mousey = mouse_position(e)[1];
            this.click_sound.play();
            this.mouse_draw_obj(context, program_state);
            });
    }

}

// CUSTOM SHADERS

class Jellyfish_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;
        varying vec4 point_position;
        varying vec4 center;

        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;    
                        
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                center = model_transform * vec4(0.0, 0.0, 2.5, 1.0);
                point_position = model_transform * vec4(position, 1.0);

                vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                vertex_color.xyz += phong_model_lights(N, vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){
                 float scalar = 0.40 + 0.3 * sin(distance(point_position.xyz, center.xyz));
                 gl_FragColor = scalar * vertex_color;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}


class Tail_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;
        varying vec4 point_position;
        varying vec4 center;

        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;    
                        
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;
                
                center = model_transform * vec4(0.0, 0.0, 0.0, 1.0);
                point_position = model_transform * vec4(position, 1.0);

                vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                vertex_color.xyz += phong_model_lights(N, vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){
                 float scalar = cos(distance(point_position.xyz, center.xyz));
                 gl_FragColor = scalar * vertex_color;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}


class Gouraud_Shader extends Shader {
    // This is a Shader using Phong_Shader as template
    // TODO: Modify the glsl coder here to create a Gouraud Shader (Planet 2)

    constructor(num_lights = 2) {
        super();
        this.num_lights = num_lights;
    }

    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return ` 
        precision mediump float;
        const int N_LIGHTS = ` + this.num_lights + `;
        uniform float ambient, diffusivity, specularity, smoothness;
        uniform vec4 light_positions_or_vectors[N_LIGHTS], light_colors[N_LIGHTS];
        uniform float light_attenuation_factors[N_LIGHTS];
        uniform vec4 shape_color;
        uniform vec3 squared_scale, camera_center;

        // Specifier "varying" means a variable's final value will be passed from the vertex shader
        // on to the next phase (fragment shader), then interpolated per-fragment, weighted by the
        // pixel fragment's proximity to each of the 3 vertices (barycentric interpolation).
        varying vec3 N, vertex_worldspace;
        varying vec4 vertex_color;

        // ***** PHONG SHADING HAPPENS HERE: *****                                       
        vec3 phong_model_lights( vec3 N, vec3 vertex_worldspace ){                                        
            // phong_model_lights():  Add up the lights' contributions.
            vec3 E = normalize( camera_center - vertex_worldspace );
            vec3 result = vec3( 0.0 );
            for(int i = 0; i < N_LIGHTS; i++){
                // Lights store homogeneous coords - either a position or vector.  If w is 0, the 
                // light will appear directional (uniform direction from all points), and we 
                // simply obtain a vector towards the light by directly using the stored value.
                // Otherwise if w is 1 it will appear as a point light -- compute the vector to 
                // the point light's location from the current surface point.  In either case, 
                // fade (attenuate) the light as the vector needed to reach it gets longer.  
                vec3 surface_to_light_vector = light_positions_or_vectors[i].xyz - 
                                               light_positions_or_vectors[i].w * vertex_worldspace;                                             
                float distance_to_light = length( surface_to_light_vector );

                vec3 L = normalize( surface_to_light_vector );
                vec3 H = normalize( L + E );
                // Compute the diffuse and specular components from the Phong
                // Reflection Model, using Blinn's "halfway vector" method:
                float diffuse  =      max( dot( N, L ), 0.0 );
                float specular = pow( max( dot( N, H ), 0.0 ), smoothness );
                float attenuation = 1.0 / (1.0 + light_attenuation_factors[i] * distance_to_light * distance_to_light );
                
                vec3 light_contribution = shape_color.xyz * light_colors[i].xyz * diffusivity * diffuse
                                                          + light_colors[i].xyz * specularity * specular;
                result += attenuation * light_contribution;
            }
            return result;
        } `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
            attribute vec3 position, normal;                            
            // Position is expressed in object coordinates.
            
            uniform mat4 model_transform;
            uniform mat4 projection_camera_model_transform;
    
            void main(){                                                                   
                // The vertex's final resting place (in NDCS):
                gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                // The final normal vector in screen space.
                N = normalize( mat3( model_transform ) * normal / squared_scale);
                vertex_worldspace = ( model_transform * vec4( position, 1.0 ) ).xyz;

                vertex_color = vec4(shape_color.xyz * ambient, shape_color.w);
                vertex_color.xyz += phong_model_lights(N, vertex_worldspace);
            } `;
    }

    fragment_glsl_code() {
        // ********* FRAGMENT SHADER *********
        // A fragment is a pixel that's overlapped by the current triangle.
        // Fragments affect the final image or get discarded due to depth.
        return this.shared_glsl_code() + `
            void main(){
                gl_FragColor = vertex_color;
                return;
            } `;
    }

    send_material(gl, gpu, material) {
        // send_material(): Send the desired shape-wide material qualities to the
        // graphics card, where they will tweak the Phong lighting formula.
        gl.uniform4fv(gpu.shape_color, material.color);
        gl.uniform1f(gpu.ambient, material.ambient);
        gl.uniform1f(gpu.diffusivity, material.diffusivity);
        gl.uniform1f(gpu.specularity, material.specularity);
        gl.uniform1f(gpu.smoothness, material.smoothness);
    }

    send_gpu_state(gl, gpu, gpu_state, model_transform) {
        // send_gpu_state():  Send the state of our whole drawing context to the GPU.
        const O = vec4(0, 0, 0, 1), camera_center = gpu_state.camera_transform.times(O).to3();
        gl.uniform3fv(gpu.camera_center, camera_center);
        // Use the squared scale trick from "Eric's blog" instead of inverse transpose matrix:
        const squared_scale = model_transform.reduce(
            (acc, r) => {
                return acc.plus(vec4(...r).times_pairwise(r))
            }, vec4(0, 0, 0, 0)).to3();
        gl.uniform3fv(gpu.squared_scale, squared_scale);
        // Send the current matrices to the shader.  Go ahead and pre-compute
        // the products we'll need of the of the three special matrices and just
        // cache and send those.  They will be the same throughout this draw
        // call, and thus across each instance of the vertex shader.
        // Transpose them since the GPU expects matrices as column-major arrays.
        const PCM = gpu_state.projection_transform.times(gpu_state.camera_inverse).times(model_transform);
        gl.uniformMatrix4fv(gpu.model_transform, false, Matrix.flatten_2D_to_1D(model_transform.transposed()));
        gl.uniformMatrix4fv(gpu.projection_camera_model_transform, false, Matrix.flatten_2D_to_1D(PCM.transposed()));

        // Omitting lights will show only the material color, scaled by the ambient term:
        if (!gpu_state.lights.length)
            return;

        const light_positions_flattened = [], light_colors_flattened = [];
        for (let i = 0; i < 4 * gpu_state.lights.length; i++) {
            light_positions_flattened.push(gpu_state.lights[Math.floor(i / 4)].position[i % 4]);
            light_colors_flattened.push(gpu_state.lights[Math.floor(i / 4)].color[i % 4]);
        }
        gl.uniform4fv(gpu.light_positions_or_vectors, light_positions_flattened);
        gl.uniform4fv(gpu.light_colors, light_colors_flattened);
        gl.uniform1fv(gpu.light_attenuation_factors, gpu_state.lights.map(l => l.attenuation));
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Define how to synchronize our JavaScript's variables to the GPU's.  This is where the shader
        // recieves ALL of its inputs.  Every value the GPU wants is divided into two categories:  Values that belong
        // to individual objects being drawn (which we call "Material") and values belonging to the whole scene or
        // program (which we call the "Program_State").  Send both a material and a program state to the shaders
        // within this function, one data field at a time, to fully initialize the shader for a draw.

        // Fill in any missing fields in the Material object with custom defaults for this shader:
        const defaults = {color: color(0, 0, 0, 1), ambient: 0, diffusivity: 1, specularity: 1, smoothness: 40};
        material = Object.assign({}, defaults, material);

        this.send_material(context, gpu_addresses, material);
        this.send_gpu_state(context, gpu_addresses, gpu_state, model_transform);
    }
}
