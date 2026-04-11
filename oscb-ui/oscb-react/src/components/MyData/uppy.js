import React, { useEffect, useState } from 'react'
import Uppy from '@uppy/core'
import XHRUpload from '@uppy/xhr-upload'
import { Dashboard } from '@uppy/react'
import GoogleDrive from '@uppy/google-drive'
import OneDrive from '@uppy/onedrive'
import Dropbox from '@uppy/dropbox'
import Url from '@uppy/url';
import "@uppy/dashboard/dist/style.css"
import "@uppy/core/dist/style.css"
import "@uppy/progress-bar/dist/style.css"
import "@uppy/status-bar/dist/style.css"
import "@uppy/drag-drop/dist/style.css"
import { NODE_API_URL, UPPY_API_URL } from '../../constants/declarations'

export default function UppyUploader(props) {

    const { isUppyModalOpen, setIsUppyModalOpen, pwd, authToken, freeSpace, publicDatasetFlag, toPublishDataset, setTaskData } = props;
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    useEffect(() => {
        setDimensions({
            width: window.innerWidth,
            height: window.innerHeight,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [window.innerWidth, window.innerHeight]);


    useEffect(() => {
        function handleResize() {
            setDimensions({
                width: window.innerWidth,
                height: window.innerHeight,
            });
        }

        window.addEventListener('resize', handleResize);

        // Cleanup function that removes the event listener
        return () => window.removeEventListener('resize', handleResize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const uppy = new Uppy({
        id: 'fileUploader',
        autoProceed: false,
        allowMultipleUploads: true,
        restrictions: {
            maxFileSize: publicDatasetFlag ? null : freeSpace * 1024 * 1024 * 1024,
            maxNumberOfFiles: 5,
            maxTotalFileSize: publicDatasetFlag ? null : freeSpace * 1024 * 1024 * 1024,
        },
        debug: false,
    });
    uppy.use(GoogleDrive, {
        companionUrl: `${UPPY_API_URL}`,
    });
    uppy.use(OneDrive, {
        companionUrl: `${UPPY_API_URL}`,
    });
    uppy.use(Dropbox, {
        companionUrl: `${UPPY_API_URL}`,
    });
    uppy.use(Url, {
        companionUrl: `${UPPY_API_URL}`,
    });
    uppy.use(XHRUpload, {
        endpoint: `${NODE_API_URL}/upload?uploadDir=${pwd}&authToken=${authToken}&publicDatasetFlag=${publicDatasetFlag}`,
        formData: true,
        fieldName: 'files'
    });

    uppy.on('complete', (result) => {
        console.log('Upload complete! We’ve uploaded these files:', result.successful);
        let filenames = result.successful.map(file => file.name);
        if (toPublishDataset) {
            setTaskData((prevTaskData) => ({
                ...prevTaskData,
                upload: {
                    ...prevTaskData.upload,
                    files: [...(prevTaskData.upload.files || []), ...filenames],
                },
            }));
        }
    });

    if (isUppyModalOpen && !toPublishDataset)
        return (<div className="uppy-modal">
            <Dashboard uppy={uppy} plugins={['GoogleDrive', 'OneDrive', 'Dropbox', 'Url']} />
            <button style={{
                top: `${dimensions.height * 0.5 + 245}px`,
                left: `${dimensions.width * 0.5 + 330}px`,
                position: "absolute",
                transform: "translate(-50%, -50%)",
                padding: "5px 5px",
                cursor: "pointer",
                border: "1px solid black",
                borderRadius: "3px"
            }}
                onClick={() => { setIsUppyModalOpen(!isUppyModalOpen) }}
            >Close
            </button>
        </div>
        )

    if (toPublishDataset) {
        return (<div className='uppy-comp'>
            <Dashboard uppy={uppy} plugins={['GoogleDrive', 'OneDrive', 'Dropbox', 'Url']} />
        </div>)
    }
}


