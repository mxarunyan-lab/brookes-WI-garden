import React from'react';
import{AlertTriangle,ArrowLeft,RefreshCw}from'lucide-react';

export default class SeedDepartmentBoundary extends React.Component{
 constructor(props){super(props);this.state={failed:false,error:null}}
 static getDerivedStateFromError(error){return{failed:true,error}}
 componentDidCatch(error,info){console.error('[Runyan Garden] Seed Department render failure',{error,info})}
 reset=()=>this.setState({failed:false,error:null});
 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="screen secondary-screen seed-tools-screen"><section className="seed-department-fallback" role="alert"><AlertTriangle/><span><small>SEED DEPARTMENT RECOVERY</small><h1>Your packet draft is still available.</h1><p>The Seed Department hit an unexpected display problem. The app did not intentionally discard the packet form or selected photos.</p><div><button className="primary-button" onClick={this.reset}><RefreshCw/>Resume seed packet</button><button onClick={this.props.onBack}><ArrowLeft/>Back to Garden Center</button></div></span></section></main>;
 }
}
