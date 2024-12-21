import React, {useState, useEffect} from 'react';
import { useTempSongsFilter } from "./FilterContext";

const FilterFooter = ({closeModal}) => {
    const { tempFilters, revertTempFilters, saveTempFilters } = useTempSongsFilter();
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchTotalResults = async () => {
            setLoading(true);
            try{
                const postData = {
                    filters: tempFilters
                };
                const response = await fetch('/songs_list/total_results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(postData)
                });
                const data = await response.json();
                setTotalResults(data['total']);
            }catch(err){
                console.error(err)
            } finally {
                setLoading(false);
            }
        };

        fetchTotalResults();
    }, [tempFilters]);

    const handleCancel = () => {
        revertTempFilters();
        closeModal();
    }
    const handleSave = () => {
        saveTempFilters();
        closeModal();
    }

    return (
        <div className='filter-footer'>
            { loading ?
                <div className='loading-container'>
                    Found:
                    <div className="loading-animation"></div>
                </div>
            : 
                `Found: ${totalResults} Songs`
            }
            <div>
                <button onClick={handleCancel}>Cancel</button>
                <button onClick={handleSave}>Apply</button>
            </div>
        </div>
    )
}



export default FilterFooter;