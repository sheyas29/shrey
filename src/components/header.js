// src/components/Header.js

import React from 'react';

const Header = () => {
  return (
    <header style={styles.header}>
      <h1 style={styles.title}>DATA ANALYSIS</h1>
      <nav style={styles.nav}>
        <a href="/preprocess" style={styles.button}>Preprocess</a>
        <a href="/compare" style={styles.button}>Compare</a>
        <a href="/visualize" style={styles.button}>Visualize</a>
      </nav>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#282c34',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white',
  },
  title: {
    fontSize: '28px',
    margin: '0',
  },
  nav: {
    display: 'flex',
  },
  button: {
    color: 'white',
    textDecoration: 'none',
    margin: '0 10px',
    padding: '10px 20px',
    backgroundColor: '#61dafb',
    borderRadius: '5px',
    transition: 'background-color 0.3s',
  },
  buttonHover: {
    backgroundColor: '#21a1f1',
  },
};

export default Header;
