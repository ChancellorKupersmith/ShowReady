import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import emailjs from '@emailjs/browser';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/module/Home/betaAccess.css';


const BetaAccess = () => {
    const [betaReqModalIsOpen, setBetaReqModalIsOpen] = useState(false);

    const BetaAccessModal = () => {
        const SERVICE_ID = 'service_9b08cdg'
        const TEMPLATE_ID = 'template_jxk6xlz'
        emailjs.init({
            publicKey: 'lq4m8SEWmg2UdekP9',
            blockHeadless: true,
            limitRate: {
                id: 'app',
                // Allow 1 request per 10s
                throttle: 10000,
            },
        });
        
        const [userEmail, setUserEmail] = useState('');
        const [userName, setUserName] = useState('');
        const [userNote, setUserNote] = useState('');
        const [invalidEmail, setInvalidEmail] = useState(false);
        const [invalidName, setInvalidName] = useState(false);
        
        const sendBetaAccessReqEmail = () => {
            if(!userName) setInvalidName(true);
            if(!userEmail) setInvalidEmail(true);
            if(!userName || !userEmail) return;
            const template_params = {
                user_email: userEmail,
                user_name: userName,
                user_note: userNote
            }
            emailjs.send(SERVICE_ID, TEMPLATE_ID, template_params).then(
                (response) => {
                    console.log(response)
                    toast.success('Request Sent')
                },
                (error) => {
                    console.error(error);
                    toast.error('Failed to send request, please try again');
                },
            );
        };
    
        // useEffect(() => {
        //     document.querySelector('.beta-request-modal').addEventListener('click', (event) => event.stopPropagation());
        // }, [])
    
        
        return (
            <div className='beta-request-modal'>
                <h3>Beta Access Request</h3>
                <div className='input-container'>
                <label htmlFor='name-input'>Name:</label>
                <input 
                    id='name-input' 
                    type='text' value={userName}
                    className={invalidName? 'invalid' : ''}
                    placeholder={invalidName? 'FIELD REQUIRED' : ''}
                    onChange={ event => setUserName(event.target.value) }
                />
                </div>
                <div className='input-container'>
                <label htmlFor='email-input'>Email:</label>
                <input
                    id='email-input'
                    type='text' value={userEmail}
                    className={invalidEmail? 'invalid' : ''}
                    placeholder={invalidEmail? 'FIELD REQUIRED' : ''}
                    onChange={ event => setUserEmail(event.target.value) }
                />
                </div>
                <label id='notes-label' htmlFor='notes-input'>Comment:</label>
                <textarea
                    id='notes-input'
                    className='notes'
                    type='text'
                    value={userNote}
                    placeholder='anything to note.'
                    onChange={ event => setUserNote(event.target.value) }/>
                <div>
                <button onClick={() => setBetaReqModalIsOpen(false)}>Cancel</button>
                <button onClick={sendBetaAccessReqEmail}>Send Request</button>
                </div>
            </div>
        );
    };

    
    return (
        <div className='beta-access-container' onClick={() => setBetaReqModalIsOpen(true)}>
            <p> Playlist generation for Spotify is still in beta, request access here 24/25 spots left. </p>
            {betaReqModalIsOpen && createPortal(<BetaAccessModal setBetaReqModalIsOpen={ setBetaReqModalIsOpen }/>, document.body)}
        </div>
    );
};

export default BetaAccess;