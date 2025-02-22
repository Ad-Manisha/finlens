import React, { useState } from "react";
import { Button, Form, Container, Row, Col, Badge } from "react-bootstrap";
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useNavigate } from "react-router-dom";

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const navigate = useNavigate();

    let baseURL = "http://127.0.0.1:8000";

    const data = {
        name: name,
        email: email,
        password: password
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        // Perform signup logic here (e.g., API call)
        console.log("Name:", name, "Email:", email, "Password:", password);

        try {
            const response = await axios.post(`${baseURL}/users/signup`, data);
            console.log('Response:', response);

            if (response.status == 201) {
                navigate('/login');
            }


        } catch (error) {
            console.error('Error:', error.status);
            if (error.status == 400) {
                setError("Email already exists");
            }
            if (error.status == 422) {
                setError("Password must be at least 6 characters long");
            }
        }
    };

    return (
        <Container>
            <h2 className="my-4 text-success">Sign Up</h2>

            {error && (
                <div className="mb-3">
                    <Badge bg="danger">{error}</Badge>
                </div>
            )}

            <Form onSubmit={handleSignup}>
                <Row>
                    <Col md={4}>
                        <Form.Group controlId="formName">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </Form.Group>

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
                    Sign Up
                </Button>
            </Form>
            <small>Already have an account ?
                <Link to={'/login'} className="text-decoration-none fw-bold text-success"> Sign In</Link>
            </small>
        </Container>
    );
};

export default Signup;
