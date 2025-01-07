import React, {useState} from 'react';

export const ReqExFilterTab = ({reqex, label, value, onClickFunc}) => {
    return (
        <div className={'filter-tab ' + (reqex + '-filter-tab')}>
            {(label && <span>{label}</span>)}
            <span>{value}</span>
            {(onClickFunc && <button onClick={onClickFunc}>X</button>)}
        </div>
    )
}

export const ReqExList = ({reqChildren, exChildren}) => {
    return (
        <div className='reqex-list-container'>
            <div className='reqex-list'>
                <p className='reqex-list-label'>Requiring</p>
                {reqChildren}
            </div>
            <div className='reqex-list'>
                <p className='reqex-list-label'>Excluding</p>
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