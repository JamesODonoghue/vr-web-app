import { LitElement, html, customElement, css } from "lit-element";
// import rocketUrl from "./assets/models/rocket.glb?url";
import "@google/model-viewer";
/**
 * An example element.
 *
 * @slot - This element has a slot
 * @csspart button - The button
 */
@customElement("vr-app")
export class VrApp extends LitElement {
    static get styles() {
        return css`
            .main {
                display: flex;
            }
        `;
    }

    connectedCallback(): void {
        super.connectedCallback();
        this.init();
    }

    private async init() {
        if (!navigator.xr) {
            return;
        }
        const result = await navigator.xr.isSessionSupported("immersive-vr");

        if (!result) {
            return;
        }
        const session = await navigator.xr.requestSession("immersive-vr");
        this.handleSessionStarted(session);
    }

    async handleSessionStarted(session: XRSession) {
        // Create a WebGL context to render with, initialized to be compatible
        // with the XRDisplay we're presenting to.
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl", { xrCompatible: true });

        if (!gl) {
            return;
        }

        // Use the new WebGL context to create a XRWebGLLayer and set it as the
        // sessions baseLayer. This allows any content rendered to the layer to
        // be displayed on the XRDevice.
        session.updateRenderState({ baseLayer: new XRWebGLLayer(session, gl) });

        // Get a reference space, which is required for querying poses. In this
        // case an 'local' reference space means that all poses will be relative
        // to the location where the XRDevice was first detected.

        const xrRefSpace = await session.requestReferenceSpace("local");

        // Inform the session that we're ready to begin drawing.
        const requestAnimationFrameStatus = session.requestAnimationFrame(
            (time, frame) => this.handleXRFrame(time, frame, xrRefSpace, gl)
        );
        console.log(requestAnimationFrameStatus);
    }

    handleXRFrame(
        time: number,
        frame: XRFrame,
        xrRefSpace: XRReferenceSpace | XRBoundedReferenceSpace,
        gl: WebGLRenderingContext
    ) {
        const session = frame.session;

        // Inform the session that we're ready for the next frame.
        session.requestAnimationFrame((time, frame) =>
            this.handleXRFrame(time, frame, xrRefSpace, gl)
        );

        // Get the XRDevice pose relative to the reference space we created
        // earlier.
        const pose = frame.getViewerPose(xrRefSpace);

        // Getting the pose may fail if, for example, tracking is lost. So we
        // have to check to make sure that we got a valid pose before attempting
        // to render with it. If not in this case we'll just leave the
        // framebuffer cleared, so tracking loss means the scene will simply
        // disappear.

        if (!pose) {
            return;
        }

        const glLayer = session.renderState.baseLayer;

        if (glLayer) {
            return;
        }

        // If we do have a valid pose, bind the WebGL layer's framebuffer,
        // which is where any content to be displayed on the XRDevice must be
        // rendered.
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer!.framebuffer);

        // Update the clear color so that we can observe the color in the
        // headset changing over time.
        gl.clearColor(
            Math.cos(time / 2000),
            Math.cos(time / 4000),
            Math.cos(time / 6000),
            1.0
        );

        // Clear the framebuffer
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Normally you'd loop through each of the views reported by the frame
        // and draw them into the corresponding viewport here, but we're
        // keeping this sample slim so we're not bothering to draw any
        // geometry.
        /*for (let view of pose.views) {
            let viewport = glLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y,
                        viewport.width, viewport.height);
            // Draw a scene using view.projectionMatrix as the projection matrix
            // and view.transform to position the virtual camera. If you need a
            // view matrix, use view.transform.inverse.matrix.
          }*/
    }

    render() {
        return html`
            <h1>This is a test</h1>
            <div class="main">
                <!-- <div class="main__left">
                    <h1>Rocket 3</h1>
                </div> -->
                <div class="main__right"></div>
            </div>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "vr-app": VrApp;
    }
}
