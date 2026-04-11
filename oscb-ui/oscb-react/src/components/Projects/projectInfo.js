import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from "@mui/material";
import { Close as CloseIcon, PersonAdd, Delete } from "@mui/icons-material";
import { NODE_API_URL } from '../../constants/declarations';
import { isUserAuth, getCookie } from "../../utils/utilFunctions";
import { useNavigate } from "react-router-dom";
// Removed useUserAuthCheck import

const ProjectAdminPanel = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [newProjectName, setNewProjectName] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [newMemberName, setNewMemberName] = useState("");

  const [currentUser, setCurrentUser] = useState("");

  // Fetch projects
  const fetchProjects = async (username) => {
    setLoading(true);
    try {
      const res = await fetch(`${NODE_API_URL}/projects/list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, adminPage: true }),
      });
      const data = await res.json();
      setProjects(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };


  useEffect(() => {
    isUserAuth(getCookie('jwtToken'))
      .then((authData) => {
        if (authData.isAuth) {
          console.log("User is admin and has access to this page");
          setCurrentUser(authData.username);
          fetchProjects(authData.username);
        } else {
          navigate("/routing");
        }
      })
      .catch((error) => {
        console.error(error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create new project
  const createProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await fetch(`${NODE_API_URL}/projects/createNew`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ project_name: newProjectName, admin: currentUser }),
      });
      const newProject = await res.json();
      setProjects((prev) => [...prev, newProject]);
      setNewProjectName("");
    } catch (err) {
      console.error(err);
    }
  };

  // Add member
  const addMember = async () => {
    if (!newMemberName.trim() || !selectedProject) return;
    try {
      await fetch(`${NODE_API_URL}/projects/${selectedProject._id}/addMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member: newMemberName }),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p._id === selectedProject._id && !p.members.includes(newMemberName)
            ? { ...p, members: [...p.members, newMemberName] }
            : p
        )
      );
      setNewMemberName("");
    } catch (err) {
      console.error(err);
    }
  };

  // Remove member
  const removeMember = async (projectId, member) => {
    try {
      await fetch(`${NODE_API_URL}/projects/${projectId}/removeMember`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member }),
      });
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId
            ? { ...p, members: p.members.filter((m) => m !== member) }
            : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box p={4} maxWidth={900} mx="auto">
      <Typography variant="h4" gutterBottom>
        My Projects
      </Typography>

      <Box display="flex" mb={4} gap={8} alignItems="center">
        <TextField
          label="New Project Name"
          variant="outlined"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={createProject}
          disabled={!newProjectName.trim()}
        >
          Create Project
        </Button>
      </Box>

      <Box
        display="flex"
        flexWrap="wrap"
        gap={24}
        justifyContent="center"
      >
        {loading ? (
          <Typography>Loading projects...</Typography>
        ) : projects.length === 0 ? (
          <Typography>No projects found.</Typography>
        ) : (
          projects.map((project) => (
            <Card
              key={project._id}
              variant="outlined"
              style={{ width: 280, boxShadow: "0 3px 6px rgba(0,0,0,0.1)" }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {project.project_name}
                </Typography>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Admin: {project.admin}
                </Typography>

                <Box
                  display="flex"
                  flexWrap="wrap"
                  gap={1}
                  mb={2}
                  minHeight={40}
                >
                  {project.members.map((member) => (
                    <Chip
                      key={member}
                      label={member}
                      color={member === currentUser ? "primary" : "default"}
                      onDelete={
                        member !== currentUser
                          ? () => removeMember(project._id, member)
                          : undefined
                      }
                      deleteIcon={
                        member !== currentUser ? <Delete fontSize="small" /> : null
                      }
                      style={{ cursor: member !== currentUser ? "pointer" : "default" }}
                    />
                  ))}
                </Box>

                <Button
                  variant="outlined"
                  startIcon={<PersonAdd />}
                  onClick={() => setSelectedProject(project)}
                  fullWidth
                >
                  Manage Members
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Dialog to add members */}
      <Dialog
        open={Boolean(selectedProject)}
        onClose={() => {
          setSelectedProject(null);
          setNewMemberName("");
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Manage Members for "{selectedProject?.project_name}"
          <IconButton
            aria-label="close"
            onClick={() => {
              setSelectedProject(null);
              setNewMemberName("");
            }}
            style={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Box display="flex" gap={2} mb={3}>
            <TextField
              label="Add Member Username"
              variant="outlined"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === "Enter") addMember();
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={addMember}
              disabled={!newMemberName.trim()}
            >
              Add
            </Button>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Members
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {selectedProject?.members.map((member) => (
              <Chip
                key={member}
                label={member}
                color={member === currentUser ? "primary" : "default"}
                onDelete={
                  member !== currentUser
                    ? () => removeMember(selectedProject._id, member)
                    : undefined
                }
                deleteIcon={
                  member !== currentUser ? <Delete fontSize="small" /> : null
                }
                style={{ cursor: member !== currentUser ? "pointer" : "default" }}
              />
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setSelectedProject(null);
              setNewMemberName("");
            }}
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectAdminPanel;
