"use client";
import Image from "next/image";
import styles from "./page.module.css";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { Button } from "@mui/material";
import DenseIssueTable from "../../DenseIssueTable";
import ProjectsTable from "../../ProjectsTable";
import pako from "pako";
import Viewer from "./Viewer";

export default function Home() {
  const [token, setToken] = useState(null);
  const [issues, setIssues] = useState([]);
  const [accountID, setAccountID] = useState(null);
  const [projects, setListOfProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const grantAccessLinkRef = useRef(null);
  const [persistentProjectName, setPersistentProjectName] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchToken();
  }, []);
  const generateBase64Credentials = (clientId, clientSecret) => {
    const credentials = `${clientId}:${clientSecret}`;
    console.log(btoa(credentials));
    return btoa(credentials); // Encodes the string to Base64
  };
  const fetchToken = async () => {
    setLoading(true);
    const queryParams = new URLSearchParams(window.location.search);
    const code = queryParams.get("code");
    console.log(code);
    try {
      const response = await axios.post(
        "https://developer.api.autodesk.com/authentication/v2/token",
        new URLSearchParams({
          grant_type: "authorization_code",
          code: code,
          redirect_uri: "http://localhost:3000/",
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization:
              "Basic QTZNeXpzVE5zUm5WWktycGVGdnVuSFR4U2JBODZrWUo5cm5sak94anhudkIwS0lsOjQyYWJqT0FkdVFlb1g3R0pXbVFVa2xnSklTVndscmtyZ05xSUNMVmN6blVDRGZ4d3hvdEYzdk9qVHVKWHRmRU0=",
          },
        }
      );
      console.log("Fetching token finished 100" + loading);
      console.log("Token Response:", response.data);
      const responseAccount = await axios.get(
        "https://developer.api.autodesk.com/project/v1/hubs",
        {
          headers: {
            Authorization: "Bearer " + response.data?.access_token,
          },
        }
      );
      console.log(
        "Account Response:",
        responseAccount.data.data[0]?.id.substring(2)
      );
      setToken(response.data?.access_token);
      setAccountID(responseAccount.data.data[0]?.id.substring(2));
      setLoading(false);
    } catch (error) {
      console.log(
        "Error fetching token:",
        error.response ? error.response.data : error.message
      );
    }
  };
  const getProjects = async () => {
    try {
      const responseProjects = await axios.get(
        `https://developer.api.autodesk.com/construction/admin/v1/accounts/794c12c6-649c-4eb5-81fb-6112afbff47b/projects?filter[platform]=acc&filter[status]=active&limit=200`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      const listOfProjects = responseProjects.data.results || [];
      console.log("Projects Response:", listOfProjects);

      for (
        let index = 0;
        index < responseProjects.data.results.length;
        index++
      ) {
        const element = responseProjects.data.results[index];
        setListOfProjects((prev) => [...prev, element]);
      }
    } catch (error) {
      console.error(
        "Error fetching projects:",
        error.response ? error.response.data : error.message
      );
      if (error?.response.data?.errorCode === "AUTH-006") {
        grantAccessLinkRef.current.click();
      }
    }
  };
  const getIssues = async (projectId) => {
    try {
      const response = await axios.get(
        "https://developer.api.autodesk.com/construction/issues/v1/projects/" +
          projectId +
          "/issues",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      setIssues(response.data?.results);
      setPersistentProjectName(selectedProject?.name);
      console.log("Issues Response:", response.data.results);
    } catch (error) {
      console.error(
        "Error fetching issues:",
        error.response ? error.response.data : error.message
      );
      if (error?.response.data?.errorCode === "AUTH-006") {
        grantAccessLinkRef.current.click();
      }
    }
  };

  const getClashedElementInfo = async (containerID) => {
    try {
      const responseModelSets = await axios.get(
        "https://developer.api.autodesk.com/bim360/modelset/v3/containers/" +
          containerID +
          "/modelsets",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      const modelsSets = responseModelSets.data.modelSets.filter(
        (element) => element.isDisabled === false
      );
      console.log("Modelsets Response:", modelsSets);

      let tests = [];
      let clashIDs = [];
      for (let index = 0; index < modelsSets.length; index++) {
        const modelSet = modelsSets[index];
        const responseAssignedToIssue = await axios.get(
          "https://developer.api.autodesk.com/bim360/clash/v3/containers/" +
            containerID +
            "/modelsets/" +
            modelSet.modelSetId +
            "/clashes/assigned?issueId=" +
            selectedIssue.id,

          {
            headers: {
              Authorization: "Bearer " + token,
            },
          }
        );

        if (responseAssignedToIssue.data.groups.length > 0) {
          responseAssignedToIssue.data.groups.forEach((group) => {
            if (group.issueId === selectedIssue.id) {
              tests.push(responseAssignedToIssue.data);
            }
          });
        }
      }

      let testResources = [];
      for (let index = 0; index < tests.length; index++) {
        const test = tests[index];
        for (
          let secondIndx = 0;
          secondIndx < test.groups.length;
          secondIndx++
        ) {
          const testId = test?.groups[secondIndx]?.clashTestId;
          clashIDs = test?.groups[secondIndx]?.clashes;
          const responseClashResources = await axios.get(
            "https://developer.api.autodesk.com/bim360/clash/v3/containers/" +
              containerID +
              "/tests/" +
              testId +
              "/resources",
            {
              headers: {
                Authorization: "Bearer " + token,
              },
            }
          );
          testResources.push(responseClashResources.data);
        }
      }
      const resources = await fetchResources(testResources, clashIDs);
      console.log("Resources:", resources);
      let modelIDs = [];
      resources.instance.forEach((instance) => {
        if (
          !modelIDs.includes(instance.ldid) ||
          !modelIDs.includes(instance.rdid)
        ) {
          modelIDs.push(instance.ldid);
          modelIDs.push(instance.rdid);
        }
      });
      loadModels({
        docs: resources.document.documents.filter((doc) => {
          return modelIDs.includes(doc.id);
        }),
        instances: resources.instance,
      });
    } catch (error) {
      console.error(
        "Error fetching modelsets:",
        error?.response ? error.response.data : error.message
      );
      if (error?.response.data?.errorCode === "AUTH-006") {
        grantAccessLinkRef.current.click();
      }
    }
  };

  const fetchResources = async (testResources, includedIDs) => {
    const urlOfInstance = testResources[0].resources.find((url) =>
      url.type.includes("instance")
    ).url; // TODO: only first test is considered
    const response = await fetch(
      urlOfInstance // TODO: Proxy is used to bypass CORS
    );
    const jsonResponseOfInstance = await response.json();

    const filteredInstances = jsonResponseOfInstance?.["instances"].filter(
      (instance) => {
        return includedIDs.includes(instance.cid);
      }
    );
    console.log("Filtered Instances:", filteredInstances);
    const urlOfDocument = testResources[0].resources.find((url) =>
      url.type.includes("document")
    ).url; // TODO: only first test is considered
    const responseDocument = await fetch(
      urlOfDocument // TODO: Proxy is used to bypass CORS
    );
    const jsonResponseOfDocument = await responseDocument.json();

    return {
      instance: filteredInstances,
      document: jsonResponseOfDocument,
    };
  };

  const loadModels = async (docsObject) => {
    const options = {
      env: "AutodeskProduction2",
      api: "derivativeV2",
      getAccessToken: function (onTokenReady) {
        var timeInSeconds = 3600; // Use value provided by APS Authentication (OAuth) API
        onTokenReady(token, timeInSeconds);
      },
      accessToken: token,
      language: "en",
    };
    try {
      const { docs, instances } = docsObject;
      console.log("Docs:", docs);
      Autodesk.Viewing.Initializer(options, () => {
        const viewer = new Autodesk.Viewing.AggregatedView();
        const htmlDiv = document.getElementById("viewerDiv");
        let bubbleNodes = [];

        viewer.init(htmlDiv, {}).then(function () {
          Promise.all(
            docs.map((doc) => {
              return new Promise((resolve, reject) => {
                Autodesk.Viewing.Document.load(
                  "urn:" + btoa(doc.urn),
                  (doc) => {
                    // Set the nodes from the doc
                    var nodes = doc.getRoot().search({ type: "geometry" });
                    // Load the first bubble node. This assumes that a bubbleNode was successfully found
                    //viewer.setNodes(nodes[0]); // is used for single model load
                    bubbleNodes.push(nodes[0]);
                    resolve();
                  },
                  (errorCode, errorMsg, messages) => {
                    // Do something with the failed document.
                    // ...
                    reject();
                  }
                );
              });
            })
          ).then(() => {
            viewer.setNodes(bubbleNodes);

            viewer.viewer.addEventListener(
              Autodesk.Viewing.AGGREGATE_SELECTION_CHANGED_EVENT,
              (event) => {
                //console.log(event.selections);
                console.log(viewer.viewer.getAggregateSelection());
              }
            );
            viewer.viewer.addEventListener(
              Autodesk.Viewing.EXPLODE_CHANGE_EVENT,
              (event) => {
                viewer.viewer.select(6261);
              }
            );
          });
        });
      });
    } catch (error) {
      console.error("Error loading models:", error);
    }
  };
  const dev = async () => {
    // Autodesk.Viewing.Document.load(
    //   "urn:" +
    //     btoa("urn:adsk.wipprod:fs.file:vf.ZpxjcUz_Tq6h4lXLGbsBEA?version=2"),
    //   (doc) => {
    //     const viewables = doc.getRoot().getDefaultGeometry();
    //     const viewerDiv = document.getElementById("viewerDiv");
    //     //const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDiv);
    //     const startedCode = viewer.start();
    //     viewer.loadDocumentNode(doc, viewables).then((i) => {
    //       console.log("Document asdasd");
    //       i.getObjectTree((tree) => {
    //         console.log("Tree:", tree.getNodeName(27551));
    //         tree.enumNodeFragments(tree.getRootId()),
    //           (fragId) => {
    //             const nodeName = tree.getNodeName(fragId);
    //             console.log("Node Name:", nodeName);
    //           };
    //       });
    //       viewer.addEventListener(
    //         Autodesk.Viewing.SELECTION_CHANGED_EVENT,
    //         () => {
    //           console.log(viewer.getSelection());
    //         }
    //       );
    //     });
    //   },
    //   (code, message, errors) => console.error(code, message, errors)
    // );
    // try {
    //   const encodedUrn = btoa(
    //     "urn:adsk.wipprod:fs.file:vf.zUX5uMTtS26OOsQ6kI1Jbw?version=1"
    //   );
    //   const response = await axios.get(
    //     "https://developer.api.autodesk.com/modelderivative/v2/designdata/" +
    //       encodedUrn +
    //       "/metadata",
    //     {
    //       headers: {
    //         Authorization: "Bearer " + token,
    //       },
    //     }
    //   );
    //   console.log("DEV:", response.data);
    // } catch (error) {
    //   console.error(
    //     "Error fetching issues:",
    //     error.response ? error.response.data : error.message
    //   );
    //   if (error?.response.data?.errorCode === "AUTH-006") {
    //     grantAccessLinkRef.current.click();
    //   }
    // }
  };

  const onClickIssue = async (issue) => {
    console.log("Issue clicked:", issue);
    setSelectedIssue(issue);
  };
  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };
  return (
    <div className={styles.page}>
      <div
        style={{
          width: "50% important!",
          height: "50% important!",
          border: "1px solid black",
          bottom: 5,
          position: "absolute",
        }}
        id="viewerDiv"
      ></div>
      <div
        className={styles.main}
        style={{
          position: "absolute",
          top: "51%",
        }}
      >
        <Image
          className={styles.logo}
          src="/SU-YAPI LOGO_primary_eng.png"
          alt="SUYAPI logo"
          width={300}
          height={50}
          priority
        />
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          Code developed by BIM Unit
        </div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          Get Issues, Model Sets, Clash Tests, Clash Test Resources and Assigned
          Clashes
        </div>
        <div style={{ fontSize: 16 }}>
          To get started with the API, you need to grant access to your data.
        </div>
        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://developer.api.autodesk.com/authentication/v2/authorize?response_type=code&client_id=A6MyzsTNsRnVZKrpeFvunHTxSbA86kYJ9rnljOxjxnvB0KIl&redirect_uri=http://localhost:3000/&scope=data:read account:read data:write bucket:create bucket:delete"
            rel="noopener noreferrer"
            ref={grantAccessLinkRef}
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            Grant access to your data!
          </a>
          {loading && !token ? (
            <div style={{ fontSize: 14, margin: "auto" }}>Loading...</div>
          ) : (
            <div>
              <Button
                variant="outlined"
                onClick={getProjects}
                sx={{
                  width: 200,
                  height: 45,
                  backgroundColor: "gray",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: "bold",
                  fontSize: 12,
                  borderColor: "black",
                }}
              >
                Get Projects
              </Button>
            </div>
          )}
        </div>

        {token && projects.length > 0 && (
          <div>
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "start",
                justifyContent: "space-around",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    minWidth: 400,
                    minHeight: 50,
                    border: "1px solid",
                    padding: 8,
                    fontSize: 16,
                    borderRadius: 5,
                    backgroundColor: "lightgray",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Selected Project: {selectedProject?.name}
                </div>
                {selectedProject && (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => getIssues(selectedProject?.id)}
                    sx={{
                      width: 200,
                      backgroundColor: "black",
                      color: "white",
                      borderRadius: 10,
                      fontWeight: "bold",
                      fontSize: 12,
                      borderColor: "black",
                    }}
                  >
                    Fetch issues
                  </Button>
                )}
              </div>
              <ProjectsTable rows={projects} onRowClick={handleSelectProject} />
            </div>
            {/* <Viewer
              runtime={{ accessToken: token }}
              urn={btoa(
                "urn:adsk.wipprod:fs.file:vf.zUX5uMTtS26OOsQ6kI1Jbw?version=1"
              )}
              onCameraChange={({ viewer, camera }) => {
                setCamera(camera.getWorldPosition());
              }}
            ></Viewer> */}
            {persistentProjectName && issues.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "start",
                  justifyContent: "space-around",
                  gap: 20,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      minWidth: 400,
                      minHeight: 50,
                      border: "1px solid",
                      padding: 8,
                      fontSize: 16,
                      borderRadius: 5,
                      backgroundColor: "lightgray",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    Selected Issue: {selectedIssue?.displayId} for Project:{" "}
                    {persistentProjectName}
                  </div>

                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() =>
                      getClashedElementInfo(selectedIssue?.containerId)
                    }
                    sx={{
                      width: 200,
                      backgroundColor: "black",
                      color: "white",
                      borderRadius: 10,
                      fontWeight: "bold",
                      fontSize: 12,
                      borderColor: "black",
                    }}
                  >
                    Show Models
                  </Button>
                </div>
                {DenseIssueTable(issues, onClickIssue)}
              </div>
            )}

            <div
              style={{
                fontWeight: "bold",
                minWidth: 400,
                minHeight: 50,
                border: "1px solid",
                padding: 8,
                fontSize: 16,
                borderRadius: 5,
                backgroundColor: "lightgray",
                display: "flex",
                alignItems: "center",
              }}
            >
              Selected Issue: {selectedIssue?.displayId}
            </div>
          </div>
        )}
      </div>
      <div className={styles.footer}>
        <a
          href="https://www.linkedin.com/company/su-yapi/posts/?feedView=all"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/window.svg"
            alt="Window icon"
            width={16}
            height={16}
          />
          Linkedin
        </a>
        <a
          href="https://www.suyapi.com.tr/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Go to suyapi.com.tr →
        </a>
      </div>
    </div>
  );
}
