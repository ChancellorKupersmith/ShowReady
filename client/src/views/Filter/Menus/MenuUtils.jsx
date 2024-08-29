import React from 'react';

export const ReqExFilterTab = ({keyVal, label, value, onClickFunc}) => {
    return (
        <div key={keyVal} className='reqex-filter-tab'>
            <span>{label}</span>
            <span>{value}</span>
            <button onClick={onClickFunc}>X</button>
        </div>
    )
}

export const ReqExList = ({reqChildren, exChildren}) => {
    return (
        <div className='reqex-list'>
            <div className='reqfilters-list'>
                <p>Requiring</p>
                {reqChildren}
            </div>
            <div className='exfilters-list'>
                <p>Excluding</p>
                {exChildren}
            </div>
        </div>
    )
}