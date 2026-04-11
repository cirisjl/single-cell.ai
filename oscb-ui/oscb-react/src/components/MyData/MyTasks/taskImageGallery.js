import { useEffect, useState } from 'react';
import { NODE_API_URL } from '../../../constants/declarations';

function TaskImageGallery({ figures }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    if (figures) {
      fetch(NODE_API_URL + '/load-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderPath: figures }),
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setImages(data);
          } else {
            console.error('Invalid response:', data);
          }
        })
        .catch(err => {
          console.error('Failed to load images:', err);
        });
    }
  }, [figures]);

  return (
    <>
      {figures && (
        <div className="grid grid-cols-3 gap-4 p-4">
          {images.map(({ fileName, base64 }, idx) => {
            const nameWithoutExt = fileName.replace(/_/g, ' ')        // Replace underscores with spaces
                                          .replace(/\.[^/.]+$/, '');   // Remove file extension
                                          // .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()); // Capitalize
            return (
                <div key={idx} className="flex flex-col items-center">
                <p className="text-sm truncate max-w-full text-center"><h2>{nameWithoutExt}</h2></p>
                <img
                    src={base64}
                    alt={nameWithoutExt}
                    className="rounded shadow w-full h-auto mb-2"
                />
                </div>
            );
            })}
        </div>
      )}
    </>
  );
}

export default TaskImageGallery;
