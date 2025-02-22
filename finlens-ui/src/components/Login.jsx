import React, { useState } from "react";
import { Button, Form, Container, Row, Col, Badge } from "react-bootstrap";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';


const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    let baseURL = "http://127.0.0.1:8000";

    const data = {
        email: email,
        password: password
    };


    const handleLogin = async (e) => {
        e.preventDefault();
        // Perform login logic here (e.g., API call)
        console.log("Email:", email, "Password:", password);
        // If login is successful, redirect to dashboard or home

        try {
            const response = await axios.post(`${baseURL}/users/login`, data)
            console.log('Response from login:', response);
            if (localStorage.getItem("user")) {
                localStorage.removeItem("user");
            }
            localStorage.setItem("user", JSON.stringify(response.data));

            if (response.status == 200) {
                navigate('/home');
            }


        } catch (error) {
            console.error('Error:', error);
            if (error.status == 401 || error.status == 404) {
                setError("Invalid Credential");
            }

        }
    };

    return (
        <Container>
            <h2 className="my-4 text-success">Login</h2>
            {error && (
                <div className="mb-3">
                    <Badge bg="danger">{error}</Badge>
                </div>
            )}

            <Form onSubmit={handleLogin}>
                <Row>
                    <Col md={4}>

                        <Form.Group controlId="formEmail">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="formPassword">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>

                    </Col>

                </Row>




                <Button variant="success" type="submit" className="my-3">
                    Login
                </Button>
            </Form>

            <small>Don't have an account ?
                <Link to={'/signup'}
                    className="text-decoration-none fw-bold text-success"> Register</Link>
            </small>
        </Container>
    );
};

export default Login;



