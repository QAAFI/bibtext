import React, { useEffect } from 'react';
import type { NextPage } from "next";
import { Citation } from '../models/citation';
import { createSecureContext } from 'tls';
import { string } from 'zod';
const classNames = require ('classnames');
// const bibtex = require('@citation-js/plugin-bibtex');
// const bibjson = require('@citation-js/plugin-bibjson');
// const { plugins } = require('@citation-js/core');
// const config = plugins.config.get('@bibtex');
// const config2 = plugins.config.get('@bibjson');
const Cite = require('citation-js');
//Cite.plugins.add(bibtex);
//Cite.plugins.add(bibjson);

type MissingEntry = {
  contents: string;
  index: number;
  accepted: string;
  possibles: any[];
  data: {};
};


const ParseRaw: NextPage = () => {
  const [areaText, setAreaText] = React.useState('Paste text here');
  const [parsedText, setParsedText] = React.useState('parsed text here');
  const [citations, setCitations] = React.useState<Citation[]>([]);
  const [missingEntries, setMissingEntries] = React.useState<MissingEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = React.useState<MissingEntry>();
  const [searchValue, setSearchValue] = React.useState('');

  useEffect(() => {
    console.log('citations updated: ', citations);
  }, [citations]);

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  async function selectMissingEntry(entry){
    setSelectedEntry(entry);
    setSearchValue(entry.contents);
    if(!entry.possibles || entry.possibles.length == 0)
      searchForEntry(entry, entry.contents);
  }
  
  async function parseText(contents: string): Promise<string> {
    let fieldType = '';
    let articleRef = '';
   
    let tmpCitations = [];
    let tmpMissingEntries:MissingEntry[] = []; //missing doi
    try {
      let lines:string[] = contents.split('\n');
      for(let i = 0; i < lines.length; ++i){
        let line = lines[i].trim();
        if(line.length == 0) continue;

        let startDOI:number = line?.indexOf('doi:');
        if(startDOI == -1){
          tmpMissingEntries.push({contents:line, index:i, accepted:'', possibles: [], data:{}});
        }
        else
        {
          const url = "https://api.crossref.org/works/";//10.2134%2Fagronj1993.00021962008500030038x"

          const response = await fetch(url+line?.substring(startDOI).trim());
          const data = await response.json() ;
          console.log('returned data', data);
    
          const data2 = await Cite(data.message);
          let output = data2.format('bibtex', {
            format: 'text'
          });
          console.log('cite output: ', output, data2);
          tmpCitations.push(output);

        }
      }
      setMissingEntries((current)=> tmpMissingEntries );
      return tmpCitations.join('');
    }
    catch (ex) {
      console.error('Error parsing text: ' + ex);
    }
    return fieldType + ': ' + articleRef;
  }
  
  async function searchForEntry(missingEntry:MissingEntry, searchText:String){
    console.log('sending query', searchText);

    const url = "https://api.crossref.org/works";//10.2134%2Fagronj1993.00021962008500030038x"
    const queryEmail = '&mailto=j.brider@uq.edu.au';
    const queryRows = '&rows=5';

    const queryBib = "query.bibliographic=" + searchText;//Rosenthal, W.D., R.L. Vanderlip, B.S. Jackson, and G.F. Arkin. (1989). SORKAM: A grain sorghum growth model. TAES Computer Software Documentation Series No. MP-1669. Texas Agric. Exp. Stn., College Station, TX";
    const query = '?' + queryBib + queryEmail+ queryRows;
    const response = await fetch(url+query);
    const data = await response.json();

    const citeData = await Cite(data.message.items);
    console.log(citeData);
    const tmp = citeData.format('bibtex');
    console.log('formatted data', tmp);

    if(missingEntry) {
      missingEntry.possibles = citeData.data;
      missingEntry.data = citeData;

      // citeData.data.forEach(entry => {
      //   const names = entry.author ?? entry.editor; 
      //   const tmp2 = names?.reduce((prev, current) => {
      //     return current.family ? (prev ? prev + ' and ' : '') + current.family + (current.given ? ', ' + current.given : '' ) : ''
      //   }, '');
      //   console.error('author: ', tmp2, entry.author, entry);
          
      // });
    }
    console.log('data processed', citeData);

  }

  function combineAuthors(citeData:{}){
    const names = citeData.author ?? citeData.editor; 
    //console.log('entry: ', citeData.published["date-parts"][0][0], citeData );
    const tmp2 = names?.reduce((prev, current) => {
      return current.family ? (prev ? prev + ' and ' : '') + current.family + (current.given ? ', ' + current.given : '' ) : prev;
    }, '');
    // console.log('author: ', tmp2);
    return tmp2;
    // const tmp2 = citeData.authors.reduce((prev, current) => (prev ? prev + ' and ' : '') + (current.family + ', ' + current.given));
    // console.log('authors output',tmp2);
    const tmp = Cite(citeData);
    let output = tmp.format('bibliography');
    //console.log('authors output',output);
    return output;
    //return authors.reduce((prev, current) => (prev ? prev + ' and ' : '') + (current.family + ', ' + current.given));
  }

  async function copyToClipboard(entry){
    const citeData = await Cite(entry);
    // console.log(citeData);
    const copyData = citeData.format('bibtex');
    console.log('copied to clipboard: ', copyData)
    navigator.clipboard.writeText(copyData);
  }

  return (
    <>
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="md:text-[5rem] leading-normal font-extrabold text-gray-700">
          Lookup references from raw text
        </h1>
        <div className="grid gap-3 pt-3 mt-3 text-center w-full md:grid-cols-2 lg:w-2/3">
          <div>
            <p className="text-2xl text-gray-700">Input Text</p>
            <textarea className="w-full border-gray-400 border-2 h-64"
              value={areaText}
              onChange={async (e)  => {
                setAreaText(e.target.value);
                setParsedText(await parseText(e.target.value));
              }}
            />
          </div>
          <div>
            <p className="text-2xl text-gray-700">Parsed Output (bibtext)</p>
            <textarea className="w-full border-gray-400 border-2 h-64"
              value={parsedText} readOnly
            />
          </div>
        </div>
        <div className="container mx-auto flex flex-row ">
          <ul className="w-24">
            {missingEntries.map((entry => 
              <li key={entry.index} onClick={() => selectMissingEntry(entry)} 
              className={classNames(
                entry.index == selectedEntry?.index 
                  ? 'font-bold' 
                  : '')} >
                Line: {entry.index}
              </li>
            ))}
          </ul>
          <div className="w-fit flex-col">
            <div className="">{selectedEntry?.contents}</div>
            <div className="w-full flex-row pt-2">
              <input className="w-11/12 p-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 border rounded-md" 
                type="text" value={searchValue} onChange={(event => setSearchValue(event.target.value))}/>
              <button type="button" onClick={()=> searchForEntry(selectedEntry, searchValue)}
                className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >?</button>
            </div>
            <ul className="w-fit flex-row pt-2">
                {selectedEntry?.possibles.map(ce => 
                  <li key={ce.DOI} className="p-1 relative" >
                    <div >{combineAuthors(ce)} <span className="font-semibold">({ce.published["date-parts"][0][0]})</span></div>
                    <div className="italic text-sm">{ce.title[0]}</div>
                    <button className="absolute right-0 top-0 mt-4 ml-5 bg-white py-1 px-2 border border-gray-100 rounded-md shadow-sm leading-4 text-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={()=>copyToClipboard(ce)}
                    >C</button>
                  </li>
                )}
            </ul>
          </div>
        </div>
      </main>
    </>
  );
};


export default ParseRaw;
