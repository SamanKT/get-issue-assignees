"use client";
import Image from "next/image";
import styles from "./page.module.css";
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "@mui/material";
import DenseIssueTable from "../../DenseIssueTable";
import ProjectsTable from "../../ProjectsTable";

export default function Home() {
  const [token, setToken] = useState(null);
  const [issues, setIssues] = useState([]);
  const [accountID, setAccountID] = useState(null);
  const [projects, setListOfProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    fetchToken();
  }, []);
  const generateBase64Credentials = (clientId, clientSecret) => {
    const credentials = `${clientId}:${clientSecret}`;
    console.log(btoa(credentials));
    return btoa(credentials); // Encodes the string to Base64
  };
  const fetchToken = async () => {
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
    } catch (error) {
      console.log(
        "Error fetching token:",
        error.response ? error.response.data : error.message
      );
    }
  };
  const getProjects = async () => {
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

    for (let index = 0; index < responseProjects.data.results.length; index++) {
      const element = responseProjects.data.results[index];
      setListOfProjects((prev) => [...prev, element]);
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

      console.log("Issues Response:", response.data.results);
    } catch (error) {
      console.error(
        "Error fetching issues:",
        error.response ? error.response.data : error.message
      );
    }
  };
  const getModelsets = async () => {
    try {
      const response = await axios.get(
        "https://developer.api.autodesk.com/bim360/modelset/v3/containers/69992872-3a99-46df-905c-3502673c7c49/modelsets",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      console.log("Modelsets Response:", response);
    } catch (error) {
      console.error(
        "Error fetching modelsets:",
        error.response ? error.response.data : error.message
      );
    }
  };
  const getClashTests = async () => {
    try {
      const response = await axios.get(
        "https://developer.api.autodesk.com/bim360/clash/v3/containers/69992872-3a99-46df-905c-3502673c7c49/modelsets/b7a43d8f-7c4a-4a64-9805-bd7a65b7f136/tests",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      console.log("clash tests Response:", response);
    } catch (error) {
      console.error(
        "Error fetching modelsets:",
        error.response ? error.response.data : error.message
      );
    }
  };
  const getClashTestResources = async () => {
    try {
      const response = await axios.get(
        "	https://developer.api.autodesk.com/bim360/clash/v3/containers/69992872-3a99-46df-905c-3502673c7c49/tests/768e03af-3dfc-46cc-a9cd-6f5a5029577f/resources",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      response.data.resources.map((resource) => {
        console.log("clash test resources Response:", resource.url);
      });
    } catch (error) {
      console.error(
        "Error fetching modelsets:",
        error.response ? error.response.data : error.message
      );
    }
  };
  const getAssignedClashes = async (clashID) => {
    try {
      const response = await axios.get(
        "https://developer.api.autodesk.com/bim360/clash/v3/containers/69992872-3a99-46df-905c-3502673c7c49/modelsets/b7a43d8f-7c4a-4a64-9805-bd7a65b7f136/clashes/assigned?issueId=" +
          clashID,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      console.log("assigned clashes Response:", response);
    } catch (error) {
      console.error(
        "Error fetching modelsets:",
        error.response ? error.response.data : error.message
      );
    }
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
      <div className={styles.main}>
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
            href="https://developer.api.autodesk.com/authentication/v2/authorize?response_type=code&client_id=A6MyzsTNsRnVZKrpeFvunHTxSbA86kYJ9rnljOxjxnvB0KIl&redirect_uri=http://localhost:3000/&scope=data:read account:read"
            rel="noopener noreferrer"
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

          {token && (
            <div>
              <Button
                variant="outlined"
                onClick={fetchToken}
                sx={{
                  width: 200,
                  height: 45,
                  backgroundColor: "gray",
                  color: "white",
                  borderRadius: 10,
                  fontWeight: "bold",
                  fontSize: 12,
                  borderColor: "black",
                  mr: 1,
                }}
              >
                Refresh Token
              </Button>
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
              <ProjectsTable rows={projects} onRowClick={handleSelectProject} />
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
            </div>

            {issues.length > 0 && DenseIssueTable(issues, onClickIssue)}
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
            <Button
              variant="outlined"
              color="primary"
              onClick={getModelsets}
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
              Fetch model sets
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={getClashTests}
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
              Fetch clash tests
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={getClashTestResources}
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
              Fetch clash test resources
            </Button>
            <Button
              variant="outlined"
              color="primary"
              onClick={getAssignedClashes}
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
              Fetch assigned clashes
            </Button>
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
