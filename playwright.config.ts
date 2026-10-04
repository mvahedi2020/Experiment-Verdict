import {defineConfig} from '@playwright/test'
const appOrigin=process.env.APP_ORIGIN??'http://127.0.0.1:4194'
const url=new URL(appOrigin)
if(url.pathname!=='/'||url.search||url.hash||!['http:','https:'].includes(url.protocol))throw new Error('APP_ORIGIN must be an explicit HTTP origin without a path')
export default defineConfig({testDir:'./tests',workers:1,use:{baseURL:`${url.origin}/Experiment-Verdict/`,browserName:'chromium',viewport:{width:1280,height:633},trace:'retain-on-failure'},webServer:process.env.APP_ORIGIN?undefined:{command:'npm run preview',url:`${url.origin}/Experiment-Verdict/`,reuseExistingServer:false},reporter:'list'})
