import React, { useEffect } from 'react';
import type { NextPage } from "next";
import { Citation } from '../models/citation';
import { createSecureContext } from 'tls';
const bibtex = require('@citation-js/plugin-bibtex');
const { plugins } = require('@citation-js/core');
const config = plugins.config.get('@bibtex');
const Cite = require('citation-js');
Cite.plugins.add(bibtex);

const ParseBibFile: NextPage = () => {
  const [areaText, setAreaText] = React.useState('Paste text here');
  const [parsedText, setParsedText] = React.useState('parsed text here');
  const [citations, setCitations] = React.useState<Citation[]>([]);
  const [filteredCitations, setFilteredCitations] = React.useState([]);
  const [filterAuthor, setFilterAuthor] = React.useState('');
  const [filterTitle, setFilterTitle] = React.useState('');

  useEffect(() => {
    console.log('citations updated: ', citations);
  }, [citations]);

  function parseText(contents: string): string {
    let fieldType = '';
    let articleRef = '';
   
    let tmpCitations = [];
    try {
      const data2 = Cite(contents);
      setCitations(data2.data);
      console.log('cite output: ', data2);
    }
    catch (ex) {
      console.error('Error parsing text: ' + ex);
    }
    return '';
  }
  
  function filterCitations(){
    const author = filterAuthor?.trim().toLowerCase();
    const fCitations = citations.filter(cit => combineAuthors(cit)?.trim().toLowerCase().indexOf(author) > -1);
    const title = filterTitle?.trim().toLowerCase();
    if(title)
      fCitations = fCitations.filter(cit => cit.title?.trim().toLowerCase().indexOf(title) > -1);

    setFilteredCitations(fCitations);
    console.log('filtered citations: ', author, fCitations);
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

  function extractYear(citeData){
    const dates = citeData.issued ?? citeData.published; 
    //date-parts is an array itself
    const arr = dates["date-parts"];
    if(!arr) return '';
    if(arr.length == 0) return '';
    if(arr[0].length > 0)
      return '(' + arr[0][0] + ')';
    return '';
  }

  async function copyToClipboard(entry){
    //const citeData = await Cite(entry);
    const key = entry['citation-key'];
    console.log('copied to clipboard: ', key)
    navigator.clipboard.writeText(key);
  }

  return (
    <>
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <div className="grid gap-3 pt-3 mt-3 text-center w-full lg:w-2/3">
          <div>
            <p className="text-2xl text-gray-700">Paste Bibtext File contents</p>
            <textarea className="w-full border-gray-400 border-2 h-64"
              value={areaText}
              onChange={async (e)  => {
                setAreaText(e.target.value);
                setParsedText(await parseText(e.target.value));
              }}
            />
          </div>
          <div className="w-full flex-row pt-2">
              <input className="p-1 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 border rounded-md" 
                type="text" value={filterAuthor} onChange={(event => setFilterAuthor(event.target.value))}/>
              <input className="p-1 mx-2 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 border-gray-300 border rounded-md" 
                type="text" value={filterTitle} onChange={(event => setFilterTitle(event.target.value))}/>
              <button type="button" onClick={filterCitations}
                className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >?</button>
            </div>
          <ul className="w-fit flex-row pt-2 text-left">
                {filteredCitations?.map((ce, index) => 
                  <li key={ce['citation-key'] + index} className="p-2 relative border" >
                    <div className="p-1">{combineAuthors(ce)} <span className="font-semibold">{extractYear(ce)}</span></div>
                    <div className="pl-1 italic text-sm">{ce.title}</div>
                    <button className="absolute right-0 top-0 mr-2 mt-2 ml-5 bg-white py-1 px-2 border border-gray-100 rounded-md shadow-sm leading-4 text-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    onClick={()=>copyToClipboard(ce)}
                    >C</button>
                  </li>
                )}
            </ul>
        </div>
      </main>
    </>
  );
};


export default ParseBibFile;
