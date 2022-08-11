import React, { useEffect } from 'react';
import type { NextPage } from "next";
import { Citation } from '../models/citation';
import { createSecureContext } from 'tls';

const ParseBibText: NextPage = () => {
  const [areaText, setAreaText] = React.useState('Paste text here');
  const [parsedText, setParsedText] = React.useState('parsed text here');
  const [citations, setCitations] = React.useState<Citation[]>([]);

  useEffect(() => {
    console.log('citations updated: ', citations);
  }, [citations]);



  function parseText(contents: string): string {
    let fieldType = '';
    let articleRef = '';

    let tmpCitations: Citation[] = [];
    try {
      let posAmpersand = contents.indexOf('@');
      while (posAmpersand != -1) {
        let openBracket = contents.indexOf('{', posAmpersand);
        if (openBracket == -1) throw 'openBracket not found: ' + posAmpersand;

        fieldType = contents.slice(posAmpersand, openBracket);

        let comma = contents.indexOf(',', openBracket);
        if (comma == -1) {
          if (fieldType != 'Comment') throw 'invalid format - looking for comma after ' + fieldType;
        }
        else {
          articleRef = contents.slice(openBracket + 1, comma);
        }

        let closingBracket = findClosingBrace(contents, openBracket, '{', '}');
        if (closingBracket == -1) throw 'invalid format - closing bracket not found after ' + fieldType;

        //create citation from contents if it is not a comment
        if (fieldType != 'Comment')
          tmpCitations.push({ ref: articleRef, type: fieldType, title: '', contents: contents.slice(posAmpersand, closingBracket) });

        //find start of next citation
        posAmpersand = contents.indexOf('@', closingBracket);
      }

      //update title
      tmpCitations = tmpCitations.map(cit => {
        //console.log('cit.contents', cit.contents);
        let idxTitle = findIndexOfAny(cit.contents, 0, ['title={', 'title = {', 'Title={', 'Title = {']);
        let idxClose = findClosingBrace(cit.contents, idxTitle + 8, '{', '}');
        if (idxTitle == -1 || idxClose == -1) 
        {
          //check if no brackets
          idxTitle = findIndexOfAny(cit.contents, 0, ['title = "', 'title="', 'Title="', 'Title = "']);
          idxClose = findClosingBrace(cit.contents, idxTitle + 8, '"', '"');
        }
        if (idxTitle == -1 || idxClose == -1) 
        {
          console.error('invalid title: ' + cit.ref + ' (' + idxTitle + ',' + idxClose + ')');
        }
        else
        {
          cit.title = removeSurroundingBraces(cit.contents.slice(idxTitle + 9, idxClose).trim());
          //console.log('title', cit.title)
        }

        return cit;
      })
      //update current state
      setCitations((current: Citation[]) => [...current, ...tmpCitations]);
      //console.log('return parsed text: ', fieldType, articleRef);
    }
    catch (ex) {
      console.error('Error parsing text: ' + ex);
    }
    var tmp = tmpCitations.map(c => c.ref).sort();
    console.log(tmp);
    return tmp.join('\n');
  return citations.length.toString();
  }

  function removeSurroundingBraces(contents: string): string {
    contents = contents.replace("\r\n", "\n");
    contents = contents.replace("\n", "");
    contents = contents.replace(/\s\s+/g, ' ');
    //contents = contents.replace("  ", " ");
    //contents = contents.replace("  ", " ");

    if (contents.indexOf('{') == 0) {
      //if whole string is enclosed in a second set of braces then reove them
      let idxClose = findClosingBrace(contents, 0, '{', '}');
      //console.log('last', idxClose, contents.length);
      if (idxClose == contents.length - 1) {
        //console.log('brackets removed', contents.slice(1, -1));
        return contents.slice(1, -1);
      }
    }
    return contents;
  }
  function findClosingBrace(contents: string, startPos: number, openBrace: string, closeBrace: string) {
    let pos = findIndexOfAny(contents, startPos, [openBrace, closeBrace]);
    let count = 0;
    while (pos != -1) {
      count = contents[pos] == openBrace ? count + 1 : count - 1;
      if (count == 0) return pos;

      pos = findIndexOfAny(contents, pos + 1, [openBrace, closeBrace]);
    }
  }

  function findIndexOfAny(contents: string, startPos: number, searchItems: string[]): number {
    let foundItems = searchItems.map(si => contents.indexOf(si, startPos));
    return foundItems.reduce((a, b) => a == -1 ? b : b == -1 ? a : Math.min(a, b), -1);
  }

  return (
    <>
      <main className="container mx-auto flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-5xl md:text-[5rem] leading-normal font-extrabold text-gray-700">
          Create <span className="text-purple-300">T3</span> App
        </h1>
        <div className="grid gap-3 pt-3 mt-3 text-center w-full md:grid-cols-3 lg:w-2/3">
          <div>
            <p className="text-2xl text-gray-700">Input Text</p>
            <textarea className="w-full border-gray-400 border-2 h-64"
              value={areaText}
              onChange={(e) => {
                setAreaText(e.target.value);
                setParsedText(parseText(e.target.value));
              }}
            />
          </div>
          <div>
            <p className="text-2xl text-gray-700">Parsed Output</p>
            <textarea className="w-full border-gray-400 border-2 h-64"
              value={parsedText} readOnly
            />
          </div>
          <div>
            <p className="text-2xl text-gray-700">Example Input</p>
            <textarea className="w-full border-gray-400 border-2 h-64" readOnly
              value={"@article{Saltelli2002, \nauthor = {Saltelli, Andrea}, \ndoi = {10.1016/S0010-4655(02)00280-1}, \nissn = {00104655}, \njournal = {Computer Physics Communications}, \nmonth = {may}, \nnumber = {2}, \npages = {280--297}, \ntitle = {Making best use of model evaluations to compute sensitivity indices}\n}"
              }>
            </textarea>
          </div>
        </div>
      </main>
    </>
  );
};


export default ParseBibText;
