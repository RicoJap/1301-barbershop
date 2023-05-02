import React, { useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Col, Container, Row, Button, Spinner, Badge } from 'react-bootstrap';
import { useEffect } from 'react';
import firebase from '../../utils/firebase';
import { ref, get, child, remove, update } from "firebase/database";
import { useState } from 'react';
import { differenceInMonths, addMonths } from 'date-fns';
import { formatDate, resanitizeEmail } from '../../utils/utils';
import useAdminDashboard from '../../hooks/useAdminDashboard';
import { MdArrowBack } from 'react-icons/md'
import { NAPOLEON_BG, WHITE } from '../../utils/colors';
import { useNavigate } from 'react-router-dom';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const Add3Months = ({ data }) => {
  const { database } = firebase();
  const { setUpdateData } = useAdminDashboard();

  const onButtonClicked = async () => {
    if(window.confirm('Are you sure?')) {
      const email = data?.email;
      const newMembershipExpiry = addMonths(new Date(data?.membershipExpiryMs), 3);
  
      const updates = {};
      updates[`/users/${email}`] = 
      { 
        membershipStart: data?.membershipStartMs, 
        membershipExpiry: newMembershipExpiry.getTime(),
        picture: data?.picture
      }
      await update(ref(database), updates);
      setUpdateData(true);
    }
  }

  return (
    <Button onClick={onButtonClicked} variant='primary'>Add 3 mth</Button>
  )
}
const Add6Months = ({ data }) => {
  const { database } = firebase();
  const { setUpdateData } = useAdminDashboard();

  const onButtonClicked = async () => {
    if(window.confirm('Are you sure?')) {
      const email = data?.email;
      const newMembershipExpiry = addMonths(new Date(data?.membershipExpiryMs), 6);
  
      const updates = {};
      updates[`/users/${email}`] = 
      { 
        membershipStart: data?.membershipStartMs, 
        membershipExpiry: newMembershipExpiry.getTime(),
        picture: data?.picture
      }
      await update(ref(database), updates)
      setUpdateData(true);
    }
  }

  return (
    <Button onClick={onButtonClicked} variant='primary'>Add 6 mth</Button>
  )
}

const SwitchTo6Months = ({ data }) => {
  const { database } = firebase();
  const { setUpdateData } = useAdminDashboard();

  const onButtonClicked = async () => {
    if(window.confirm('Are you sure?')) {
      const email = data?.email;
      const newMembershipExpiry = addMonths(new Date(data?.membershipStartMs), 6);
  
      const updates = {};
      updates[`/users/${email}`] = 
      { 
        membershipStart: data?.membershipStartMs, 
        membershipExpiry: newMembershipExpiry.getTime(),
        picture: data?.picture
      }
      await update(ref(database), updates);
      setUpdateData(true);
    }
  }
  
  const memberPlan = () => {
    const memberStart = new Date(data?.membershipStartMs);
    const memberExpiry = new Date(data?.membershipExpiryMs);
    return differenceInMonths(memberExpiry, memberStart);
  }
  
  const is3MonthsPlan = memberPlan() <= 4

  return (
    <div>
      {is3MonthsPlan ? <Button onClick={onButtonClicked} variant='primary'>Switch to 6 mth</Button> : null}
    </div>
  )
}

const DeleteButton = ({ data }) => {
  const { database } = firebase();
  const { setUpdateData } = useAdminDashboard();

  const onDeleteButtonClicked = async () => {
    if(window.confirm('Are you sure?')) {
      const email = data?.email;
      await remove(ref(database, `users/${email}`));
      setUpdateData(true);
    }
  }

  return (
    <div>
      <Button onClick={onDeleteButtonClicked} variant='danger'>Delete</Button>
    </div>
  )
}

const ActiveInactiveBadge = ({ data }) => {
  const renderBadge = () => {
    if(data?.isMembershipActive) {
      return <Badge style={{padding: '10px 30px'}} bg="success">Active</Badge>
    } else {
      return <Badge style={{padding: '10px 30px'}} bg="danger">Inactive</Badge>
    }
  }
  
  return (
    <div>
      {renderBadge()}
    </div>
  )
}

const AdminDashboard = () => {
  const [columnDefs] = useState([
    {field: 'sanitizedEmail', sortable: true, headerName: 'Email', filter: true},
    {field: 'Plan Status', cellRenderer: ActiveInactiveBadge},
    {field: 'membershipStart', sortable: true},
    {field: 'membershipExpiry', sortable: true},
    {field: 'Add 3 months', cellRenderer: Add3Months},
    {field: 'Add 6 months', cellRenderer: Add6Months},
    {field: 'Switch to 6 months', cellRenderer: SwitchTo6Months},
    {field: 'delete', cellRenderer: DeleteButton},
  ])
  const { database } = firebase();
  const { apiLoading, setApiLoading, usersData, setUsersData, updateData, setUpdateData } = useAdminDashboard();
  const navigate = useNavigate();
  const firstRender = useRef(true);

  useEffect(() => {
    (async () => {
      // Detect if first render AND needs to update data
      if(updateData || firstRender.current) {
        setApiLoading(true);
        const snapshot = await get(child(ref(database), `users`));
        if(snapshot.exists()) {
          const response = snapshot.val();
          const data = Object.keys(response).map((email) => {
            const userAcc = response[email];
            const currentTimeMs = new Date().getTime();
            const isMembershipActive = currentTimeMs >= parseInt(userAcc.membershipStart) && currentTimeMs <= parseInt(userAcc.membershipExpiry)
            return {
              membershipExpiryMs: userAcc.membershipExpiry,
              membershipStartMs: userAcc.membershipStart,
              membershipExpiry: formatDate(userAcc.membershipExpiry),
              membershipStart: formatDate(userAcc.membershipStart),
              email,
              sanitizedEmail: resanitizeEmail(email),
              picture: userAcc.picture,
              isMembershipActive
            }
          });
          setUsersData(data);
          setApiLoading(false);
        }
        setUpdateData(false);
        firstRender.current = false;
      }
      // Handle if no users are avail
    }
    )();
  }, [updateData])

  const onBackPressed = () => {
    navigate('/profile');
  }

  return (
    <Container fluid style={{ paddingLeft: 0, paddingRight: 0 }}>
      <Row>
        <Col style={{height: 400, width: '100%'}}>
          <header style={{backgroundColor: NAPOLEON_BG}}>
            <nav style={{padding: 20, paddingLeft: 20}}>
              <MdArrowBack onClick={onBackPressed} size={35} style={{color: WHITE , cursor: 'pointer'}} />
            </nav>
          </header>
          {apiLoading ?
            <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
              <Spinner animation="border" role="status" style={{width: '4rem', height: '4rem', marginTop: 100}} />
            </div> :
            <div style={{padding: 20, height: '100%'}}>
              <AgGridReact
                className="ag-theme-alpine" 
                rowData={usersData}
                columnDefs={columnDefs}
              />
            </div>
          }
        </Col>
      </Row>
    </Container>
  )
}

export default AdminDashboard