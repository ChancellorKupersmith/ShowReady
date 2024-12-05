import React, {useState} from 'react';

export const ReqExFilterTab = ({label, value, onClickFunc}) => {
    return (
        <div className='reqex-filter-tab'>
            {(label && <span>{label}</span>)}
            <span>{value}</span>
            {(onClickFunc && <button onClick={onClickFunc}>X</button>)}
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

export const Toggle = ({label, toggled, onClick, id}) => {
    const [isToggled, toggle] = useState(toggled)

    const callback = () => {
        toggle(!isToggled)
        onClick(!isToggled)
    }

    return (
        <label className='toggle'>
            <strong>{label}</strong>
            <input style={{display: 'none'}} type="checkbox" defaultChecked={isToggled} onClick={callback} />
            <span id={id} />
        </label>
    )
}