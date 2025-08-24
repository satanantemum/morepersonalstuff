export const outline_occlusion_shader = `
varying vec2 vTextureCoord;
uniform sampler2D uSampler;
uniform sampler2D mask;
varying vec2 vMaskCoord;
uniform bool enable_outline;


varying vec4 vColor;


uniform float outerStrength;
uniform float innerStrength;

uniform vec4 glowColor;
uniform vec4 knockoutColor;
uniform vec4 fill_color;

uniform vec4 filterArea;
uniform vec4 filterClamp;
uniform bool knockout;

const float PI = 3.14159265358979323846264;

const float DIST = 8.0;
const float ANGLE_STEP_SIZE = min(1.2500000, PI * 2.0);
const float ANGLE_STEP_NUM = ceil(PI * 2.0 / ANGLE_STEP_SIZE);

const float MAX_TOTAL_ALPHA = ANGLE_STEP_NUM * DIST * (DIST + 1.0) / 2.0;
uniform float z;
uniform float x;
uniform float y;

void main(void) {
    vec4 color = texture2D(uSampler, vTextureCoord);
    vec4 mask = texture2D(mask, vMaskCoord);
    if ((mask.b >= y &&  mask.g >= x)){

        if (enable_outline){
            vec2 px = vec2(1.0 / filterArea.x, 1.0 / filterArea.y);

            float totalAlpha = 0.0;

            vec2 direction;
            vec2 displaced;
            vec4 curColor;

            for (float angle = 0.0; angle < PI * 2.0; angle += ANGLE_STEP_SIZE) {
                direction = vec2(cos(angle), sin(angle)) * px;

                for (float curDistance = 0.0; curDistance < DIST; curDistance++) {
                    displaced = clamp(vTextureCoord + direction *
                    (curDistance + 1.0), filterClamp.xy, filterClamp.zw);

                    curColor = texture2D(uSampler, displaced);

                    totalAlpha += (DIST - curDistance) * curColor.a;
                }
            }

            curColor = texture2D(uSampler, vTextureCoord);

            float alphaRatio = (totalAlpha / MAX_TOTAL_ALPHA);

            float innerGlowAlpha = (1.0 - alphaRatio) * innerStrength * curColor.a;
            float innerGlowStrength = min(1.0, innerGlowAlpha);

            vec4 innerColor = mix(curColor, glowColor, innerGlowStrength);

            float outerGlowAlpha = alphaRatio * outerStrength * (1. - curColor.a);
            float outerGlowStrength = min(1.0 - innerColor.a, outerGlowAlpha);

            vec4 outerGlowColor = outerGlowStrength * glowColor.rgba;


            float resultAlpha = outerGlowAlpha + innerGlowAlpha;
            gl_FragColor = vec4(glowColor.rgb * resultAlpha, resultAlpha);


            if (gl_FragColor.a <= 0.15 && color.a != 0.0){
                float output_alpha = fill_color.a;
                vec3 output_color = fill_color.rgb * output_alpha;
                gl_FragColor = vec4(output_color.rgb*color.rgb, output_alpha)*(color.a*(1.0 - gl_FragColor.a));
            }
        }
        else{
            if (gl_FragColor.a <= 0.15 && color.a != 0.0){
                float output_alpha = fill_color.a;
                vec3 output_color = fill_color.rgb * output_alpha;
                gl_FragColor = vec4(output_color.rgb*color.rgb, output_alpha)*(color.a*(1.0 - gl_FragColor.a));
            }
        }
    } else {
        gl_FragColor = color;
    }
}
`;