import React from "react";
import Layout from "./Layout";
import CounterCreator from "./CounterCreator";

const Home: React.FC = () => {
  return (
    <Layout>
      <CounterCreator />
    </Layout>
  );
};

export default Home;
