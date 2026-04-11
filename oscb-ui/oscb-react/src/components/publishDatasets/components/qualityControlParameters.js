import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// import Slider from '@mui/material/Slider';
import FormGroup from '@mui/material/FormGroup';
// import FormControlLabel from '@mui/material/FormControlLabel';
import { styled } from '@mui/material/styles';
import { Accordion, AccordionSummary, AccordionDetails, Slider, Switch } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import { makeStyles } from '@mui/styles';
// import Switch from "react-switch";

const QualityControlParameters = ({ values, setValues, defaultValues, shouldHideForSeurat }) => {

  const handleSliderChange = (event) => {
    const { name, value } = event.target;
    setValues((prevValues) => ({
      ...prevValues,
      [name]: value,
      use_default: false,
    }));
  };

  // 1. Root container (formerly 'root')
  const StyledAccordion = styled(Accordion)(({ theme }) => ({
    width: '100%',
    marginBottom: theme.spacing(2),
  }));

  // 2. Summary with Typography overrides (formerly 'panelSummary')
  const StyledSummary = styled(AccordionSummary)({
    '& .MuiTypography-h6, & .MuiTypography-body1': {
      fontSize: '15px',
    },
  });

  // 3. Details (formerly 'panelDetails')
  const StyledDetails = styled(AccordionDetails)({
    display: 'block',
    '& .MuiTypography-h6, & .MuiTypography-body1': {
      fontSize: '15px',
    },
  });

  // 4. Slider with ValueLabel overrides (formerly 'valueLabel')
  const StyledSlider = styled(Slider)({
    '& .MuiSlider-valueLabel': {
      width: 'auto',
      minWidth: '40px',
      borderRadius: '4px',
      padding: '0 8px',
      '& .MuiTypography-root': {
        fontSize: '14px',
      },
    },
  });

  // 5. Custom Blue Switch (formerly 'customSwitch')
  const StyledSwitch = styled(Switch)(({ theme }) => ({
    '& .MuiSwitch-switchBase.Mui-checked': {
      color: '#1976d2',
      '&:hover': {
        backgroundColor: 'rgba(25, 118, 210, 0.04)',
      },
    },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
      backgroundColor: '#1976d2',
    },
  }));
  // const useStyles = makeStyles((theme) => ({
  //   root: {
  //     width: '100%',
  //     marginBottom: theme.spacing(2), // Adds space between expansion panels
  //   },
  //   panelSummary: {
  //     '& .MuiTypography-h6': {
  //       fontSize: '15px', // Targeting the content directly
  //     },
  //     '& .MuiTypography-body1': {
  //       fontSize: '15px', // Ensuring all typography inside summary also gets the font size
  //     }
  //   },
  //   panelDetails: {
  //     display: 'block', // Ensures the contents take the full width and are blocked
  //     '& .MuiTypography-h6': {
  //       fontSize: '15px', // Targeting the content directly
  //     },
  //     '& .MuiTypography-body1': {
  //       fontSize: '15px', // Ensuring all typography inside summary also gets the font size
  //     }
  //   },
  //   valueLabel: {
  //     // Increase the size of the value label to fit longer text
  //     '& .MuiSlider-valueLabel': {
  //       width: 'auto', // Allow the width to auto-adjust to content
  //       minWidth: '40px', // Ensure a minimum width to avoid too narrow labels
  //       borderRadius: '4px', // Adjust for a more rectangular shape
  //       padding: '0 8px', // Add some padding horizontally to accommodate wider numbers

  //       // Ensure the font size is 14px within the value label
  //       '& .MuiTypography-root': {
  //         fontSize: '14px',
  //       },
  //     },
  //   },
  //   customSwitch: {
  //     '& .MuiSwitch-switchBase.Mui-checked': {
  //       color: '#1976d2',
  //       '&:hover': {
  //         backgroundColor: 'rgba(25, 118, 210, 0.04)', // Lighter shade for hover, adjust opacity as needed
  //       },
  //     },
  //     '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
  //       backgroundColor: '#1976d2',
  //     },
  //   },
  // }));

  // const classes = useStyles();


  const handleSwitchChange = (name) => (checked) => {
    setValues((prevValues) => ({
      ...prevValues,
      [name]: checked,
      ...(name === 'use_default' && checked ? defaultValues : {}),
    }));
  };

  // Constructing dual-slider for min_genes and max_genes as they share the same slider
  const handleGeneSliderChange = (event, newValue) => {
    setValues((prevValues) => ({
      ...prevValues,
      min_genes: newValue[0],
      max_genes: newValue[1],
      use_default: false,
    }));
  };

  return (
    <div>
      <Typography variant="h6" gutterBottom style={{ fontWeight: 'bold' }}>
        Advanced Quality Control Parameters
      </Typography>

      <StyledAccordion defaultExpanded>
        <StyledSummary expandIcon={<ExpandMoreIcon />}>
          {/* QC Parameters */}
          <Typography variant="h6" gutterBottom>QC Parameters</Typography>
        </StyledSummary>
        <StyledDetails>
          <FormGroup>
            <Box sx={{ m: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                <b>Note:</b> An asterisk (*) indicates the default value.
              </Typography>
            </Box>

            <Box sx={{ m: 2 }}>
              <Typography gutterBottom>Min Genes - Max Genes: <b>[{values.min_genes} - {values.max_genes}]</b></Typography>
              <StyledSlider
                value={[values.min_genes, values.max_genes]}
                onChange={handleGeneSliderChange}
                valueLabelDisplay="auto"
                min={0}
                max={50000}
                step={25}
                name="min_max_genes"
                marks={[
                  { value: 200, label: '200*' },
                  { value: 2000, label: '2000' },
                  { value: 5000, label: '5000' },
                  { value: 10000, label: '10000' },
                  { value: 15000, label: '15000' },
                  { value: 20000, label: '20000' },
                  { value: 30000, label: '30000' },
                  { value: 40000, label: '40000' },
                  { value: 50000, label: '50000*' },
                ]}
              />
            </Box>

            <Box sx={{ m: 2 }}>

              <Typography gutterBottom>Min Cells: <b>{values.min_cells}</b></Typography>
              <StyledSlider
                value={values.min_cells}
                onChange={(e, val) => handleSliderChange({ target: { name: 'min_cells', value: val } })}
                valueLabelDisplay="auto"
                min={1}
                max={200}
                step={1}
                name="min_cells"
                marks={[
                  { value: 2, label: '2*' },
                  { value: 10, label: '10' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                  { value: 200, label: '200' },
                ]}
              />
            </Box>

            <Box sx={{ m: 2 }}>

              <Typography gutterBottom>Percentage of Counts in Mitochondrial Genes: <b>{values.pct_counts_mt}</b></Typography>
              <StyledSlider
                value={values.pct_counts_mt}
                onChange={(e, val) => handleSliderChange({ target: { name: 'pct_counts_mt', value: val } })}
                valueLabelDisplay="auto"
                min={1}
                max={50}
                step={1}
                name="pct_counts_mt"
                marks={[
                  { value: 3, label: '3*' },
                  { value: 5, label: '5' },
                  { value: 7, label: '7' },
                  { value: 10, label: '10' },
                  { value: 20, label: '20' },
                ]}
              />
            </Box>

            {!shouldHideForSeurat && (
              <Box sx={{ m: 2 }}>
                <Typography gutterBottom>Target Sum: <b>{values.target_sum.toExponential()}</b></Typography>
                <StyledSlider
                  value={values.target_sum}
                  onChange={(e, val) => handleSliderChange({ target: { name: 'target_sum', value: val } })}
                  //   valueLabelDisplay="auto"
                  min={0}
                  max={1e6}
                  step={1e4}
                  name="target_sum"
                  marks={[
                    // { value: 0, label: '0' },
                    { value: 1e4, label: '1e4*' },
                    { value: 1e5, label: '1e5' },
                    { value: 1e6, label: '1e6' },
                  ]}
                />
              </Box>
            )}

            <Box sx={{ m: 2 }}>

              <Typography gutterBottom>Highly Variable Genes (n_top_genes): <b>{values.n_top_genes}</b></Typography>
              <StyledSlider
                value={values.n_top_genes}
                onChange={(e, val) => handleSliderChange({ target: { name: 'n_top_genes', value: val } })}
                valueLabelDisplay="auto"
                min={100}
                max={10000}
                step={25}
                name="n_top_genes"
                marks={[
                  { value: 100, label: '100' },
                  { value: 500, label: '500' },
                  { value: 1000, label: '1000' },
                  { value: 2000, label: '2000' },
                  { value: 3000, label: '3000*' },
                  { value: 5000, label: '5000' },
                  { value: 10000, label: '10000' }]}
              />
            </Box>

            <Box sx={{ m: 2 }}>
              <Typography gutterBottom>
                Expected Doublet Rate: <b>{`${(values.doublet_rate * 100).toFixed(2)}%`}</b>
              </Typography>
              <Typography variant="caption" display="block" gutterBottom>
                <b>Note:</b> A rate of <b>0%</b> means not to classify doublets.
              </Typography>
              <StyledSlider
                value={values.doublet_rate}
                min={0}
                max={0.5}
                step={0.001}
                onChange={(e, val) => handleSliderChange({ target: { name: 'doublet_rate', value: val } })}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value * 100).toFixed(2)}%`}
                marks={[
                  { value: 0, label: '0%*' }, // Default
                  // { value: 0.008, label: '0.8%' },
                  // { value: 0.023, label: '2.3%' },
                  // { value: 0.038, label: '3.8%' },
                  // { value: 0.046, label: '4.6%' },
                  // { value: 0.061, label: '6.1%' },
                  { value: 0.08, label: '8%' },
                  { value: 0.125, label: '12.5%' },
                  { value: 0.2, label: '20%' },
                  { value: 0.5, label: '50%' },
                ]}
                name="doublet_rate"
              />
            </Box>

            <Box sx={{ m: 2 }}>
              <div>
                <label htmlFor="material-switch">
                  <p>{`Regress Cell Cycle: ${values.regress_cell_cycle ? 'Yes' : 'No'}`}</p>
                  <StyledSwitch
                    checked={values.regress_cell_cycle}
                    onChange={handleSwitchChange("regress_cell_cycle")}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={30}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={48}
                    className="react-switch"
                    id="regress_cell_cycle"
                  />
                </label>
              </div>
            </Box>
          </FormGroup>
        </StyledDetails>
      </StyledAccordion>


      <StyledAccordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          {/* Projection Parameters */}
          <Typography variant="h6" gutterBottom>Projection Parameters</Typography>
        </AccordionSummary>

        <StyledDetails>
          <FormGroup>
            <Box sx={{ m: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                <b>Note:</b> An asterisk (*) indicates the default value.
              </Typography>
            </Box>
            <Box sx={{ m: 2 }}>
              <Typography gutterBottom>n_neighbors: <b>{values.n_neighbors}</b></Typography>
              <StyledSlider
                value={values.n_neighbors}
                onChange={(e, val) => handleSliderChange({ target: { name: 'n_neighbors', value: val } })}
                valueLabelDisplay="auto"
                min={2}
                max={100}
                step={1}
                name="n_neighbors"
                marks={[
                  { value: 2, label: '2' },
                  { value: 5, label: '5' },
                  { value: 10, label: '10' },
                  { value: 15, label: '15*' },
                  { value: 20, label: '20' },
                  { value: 50, label: '50' },
                  { value: 100, label: '100' },
                ]}
              />
            </Box>

            {!shouldHideForSeurat && (
              <Box sx={{ m: 2 }}>
                <Typography gutterBottom>n_pcs: <b>{values.n_pcs}</b></Typography>
                <StyledSlider
                  value={values.n_pcs}
                  onChange={(e, val) => handleSliderChange({ target: { name: 'n_pcs', value: val } })}
                  valueLabelDisplay="auto"
                  min={0}
                  max={200}
                  step={1}
                  name="n_pcs"
                  marks={[
                    { value: 0, label: '0*' },
                    { value: 5, label: '5' },
                    { value: 10, label: '10' },
                    { value: 20, label: '20' },
                    { value: 40, label: '40' },
                    { value: 50, label: '50' },
                    { value: 125, label: '125' },
                    { value: 200, label: '200' },
                  ]}
                />
              </Box>
            )}

            <Box sx={{ m: 2 }}>
              <div>
                <label htmlFor="material-switch">
                  <p>{`Skip 3D UMAP/t-SNE: ${values.skip_3d ? 'Yes' : 'No'}`}</p>
                  <StyledSwitch
                    checked={values.skip_3d}
                    onChange={handleSwitchChange("skip_3d")}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={30}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={48}
                    className="react-switch"
                    id="skip_3d"
                  />
                </label>
              </div>
            </Box>

            <Box sx={{ m: 2 }}>
              <div>
                <label htmlFor="material-switch">
                  <p>{`Skip t-SNE: ${values.skip_tsne ? 'Yes' : 'No'}`}</p>
                  <StyledSwitch
                    checked={values.skip_tsne}
                    onChange={handleSwitchChange("skip_tsne")}
                    onColor="#86d3ff"
                    onHandleColor="#2693e6"
                    handleDiameter={30}
                    uncheckedIcon={false}
                    checkedIcon={false}
                    boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                    activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                    height={20}
                    width={48}
                    className="react-switch"
                    id="skip_tsne"
                  />
                </label>
              </div>
            </Box>

          </FormGroup>
        </StyledDetails>
      </StyledAccordion>


      <StyledAccordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6" gutterBottom>Clustering Parameters</Typography>
        </AccordionSummary>

        <StyledDetails>
          <FormGroup>
            <Box sx={{ m: 2 }}>
              <Typography variant="caption" display="block" gutterBottom>
                <b>Note:</b> An asterisk (*) indicates the default value.
              </Typography>
            </Box>
            <Box sx={{ m: 2 }}>
              <Typography gutterBottom>Resolution: <b>{values.resolution}</b></Typography>
              <StyledSlider
                value={values.resolution}
                onChange={(e, val) => handleSliderChange({ target: { name: 'resolution', value: val } })}
                valueLabelDisplay="auto"
                min={0}
                max={5}
                step={0.05}
                name="resolution"
                marks={[
                  // { value: 0, label: '0' },
                  { value: 0.1, label: '0.1' },
                  // { value: 0.25, label: '0.25' },
                  { value: 0.5, label: '0.5' },
                  { value: 1, label: '1*' },
                  { value: 2.5, label: '2.5' },
                  { value: 5, label: '5' },
                ]}
              />
            </Box>
            <Box sx={{ m: 2 }}>
              <Typography gutterBottom>n_hvg (Number of Highly Variable Genes for Heatmap): <b>{values.n_hvg}</b></Typography>
              <StyledSlider
                value={values.n_hvg}
                onChange={(e, val) => handleSliderChange({ target: { name: 'n_hvg', value: val } })}
                valueLabelDisplay="auto"
                min={20}
                max={500}
                step={1}
                name="n_hvg"
                marks={[
                  { value: 50, label: '50*' },
                  { value: 100, label: '100' },
                  { value: 150, label: '150' },
                  { value: 200, label: '200' },
                  { value: 250, label: '250' },
                  { value: 300, label: '300' },
                  { value: 500, label: '500' },
                ]}
              />
            </Box>
          </FormGroup>
        </StyledDetails>
      </StyledAccordion>

      <div style={{ marginTop: '10px' }}>
        <div>
          <label htmlFor="material-switch">
            <p>Use Default Values</p>
            <StyledSwitch
              checked={values.use_default}
              onChange={handleSwitchChange("use_default")}
              onColor="#86d3ff"
              onHandleColor="#2693e6"
              handleDiameter={30}
              // uncheckedIcon={false}
              // checkedIcon={false}
              boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
              activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
              height={20}
              width={48}
              className="react-switch"
              id="use_default"
            />
          </label>
        </div>
      </div>
    </div>
  );
};

export default QualityControlParameters;
