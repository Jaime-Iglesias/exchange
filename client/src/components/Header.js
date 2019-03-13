import React, { Component } from 'react';
import { Navbar, Nav, Form, FormControl, Button, NavDropdown } from 'react-bootstrap';

class Header extends Component {

    render() {
        return (
            <Navbar bg="dark" variant="dark">
                <Navbar.Brand href="#home"> MyExchange </Navbar.Brand>
                <Nav className="mr-auto">
                    <NavDropdown title="Tokens" id="collasible-nav-dropdown">
                        <NavDropdown.Item href="#action/3.1"> Token1 </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.2"> Token2 </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.3"> Token3 </NavDropdown.Item>
                        <NavDropdown.Item href="#action/3.4"> Token4 </NavDropdown.Item>
                    </NavDropdown>
                    <Nav.Link href="#gasprice"> Gas price </Nav.Link>
                    <Nav.Link href="#about"> About </Nav.Link>
                </Nav>
                <Form inline>
                    <FormControl type="text" placeholder="Search" className="mr-sm-2" />
                    <Button variant="outline-info">Search</Button>
                </Form>
            </Navbar>
        );
    }
}

export default Header;
