import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

const runtime = {
  /** @type {Autodesk.Viewing.InitializerOptions} */
  options: null,
  /** @type {Promise<void>} */
  ready: null,
};

/**
 * Initializes global runtime for communicating with Autodesk Platform Services.
 * Calling this function repeatedly with different options is not allowed, and will result in an exception.
 * @async
 * @param {Autodesk.Viewing.InitializerOptions} options Runtime initialization options.
 * @returns {Promise<void>}
 */
function initializeViewerRuntime(options) {
  if (!runtime.ready) {
    runtime.options = { ...options };
    runtime.ready = new Promise((resolve) =>
      Autodesk.Viewing.Initializer(runtime.options, resolve)
    );
  } else {
    if (
      ["accessToken", "getAccessToken", "env", "api", "language"].some(
        (prop) => options[prop] !== runtime.options[prop]
      )
    ) {
      return Promise.reject(
        "Cannot initialize another viewer runtime with different settings."
      );
    }
  }
  return runtime.ready;
}

/**
 * Functional wrapper for the Autodesk Platform Services viewer component.
 */
const Viewer = ({
  runtime: runtimeOptions = {},
  urn,
  selectedIds = [],
  onCameraChange,
  onSelectionChange,
}) => {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    initializeViewerRuntime(runtimeOptions)
      .then(() => {
        viewerRef.current = new Autodesk.Viewing.GuiViewer3D(
          containerRef.current
        );
        viewerRef.current.start();
        viewerRef.current.addEventListener(
          Autodesk.Viewing.CAMERA_CHANGE_EVENT,
          handleCameraChange
        );
        viewerRef.current.addEventListener(
          Autodesk.Viewing.SELECTION_CHANGED_EVENT,
          handleSelectionChange
        );
        updateViewerState({});
      })
      .catch((err) => console.error(err));

    return () => {
      if (viewerRef.current) {
        viewerRef.current.removeEventListener(
          Autodesk.Viewing.CAMERA_CHANGE_EVENT,
          handleCameraChange
        );
        viewerRef.current.removeEventListener(
          Autodesk.Viewing.SELECTION_CHANGED_EVENT,
          handleSelectionChange
        );
        viewerRef.current.finish();
        viewerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewerRef.current) {
      updateViewerState({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urn, selectedIds]);

  const updateViewerState = (prevProps) => {
    if (urn && urn !== prevProps.urn) {
      Autodesk.Viewing.Document.load(
        "urn:" + urn,
        (doc) =>
          viewerRef.current.loadDocumentNode(
            doc,
            doc.getRoot().getDefaultGeometry()
          ),
        (code, message, errors) => console.error(code, message, errors)
      );
    } else if (!urn && viewerRef.current.model) {
      viewerRef.current.unloadModel(viewerRef.current.model);
    }

    const currentSelectedIds = viewerRef.current.getSelection();
    if (
      JSON.stringify(selectedIds || []) !== JSON.stringify(currentSelectedIds)
    ) {
      viewerRef.current.select(selectedIds);
    }
  };

  const handleCameraChange = () => {
    if (onCameraChange) {
      onCameraChange({
        viewer: viewerRef.current,
        camera: viewerRef.current.getCamera(),
      });
    }
  };

  const handleSelectionChange = () => {
    if (onSelectionChange) {
      onSelectionChange({
        viewer: viewerRef.current,
        ids: viewerRef.current.getSelection(),
      });
    }
  };

  return <div ref={containerRef}></div>;
};

Viewer.propTypes = {
  /** Viewer runtime initialization options. */
  runtime: PropTypes.object,
  /** URN of model to be loaded. */
  urn: PropTypes.string,
  /** List of selected object IDs. */
  selectedIds: PropTypes.arrayOf(PropTypes.number),
  /** Callback for when the viewer camera changes. */
  onCameraChange: PropTypes.func,
  /** Callback for when the viewer selection changes. */
  onSelectionChange: PropTypes.func,
};

export default Viewer;
