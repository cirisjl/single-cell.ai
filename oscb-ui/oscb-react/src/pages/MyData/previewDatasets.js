import { Preview } from "../../components/MyData/previewDatasets"
import RightRail from "../../components/RightNavigation/rightRail"
import { useLocation } from 'react-router-dom';

export default function PreviewDatasets() {
    const location = useLocation();
    const message = location.state?.message || '';
    console.log('Inside Page: ' + message);

    return(
        <div className="page-container">
            <div className="left-nav">
            </div>
            <div className="main-content">
                <Preview message={message}/>
            </div>
            <div className="right-rail">
                <RightRail />
            </div>
        </div>
    )
}